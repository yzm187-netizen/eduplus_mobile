// Appwrite provisioning script (runs inside eduplus workspace)
// Usage: npm run provision
// Ensures required collections, attributes, indexes, and bucket exist.

const path = require('path');
const fs = require('fs');

// Load .env from both repo root and eduplus folder if present
try {
	const dotenv = require('dotenv');
	const rootEnv = path.join(__dirname, '..', '..', '.env');
	const appEnv = path.join(__dirname, '..', '.env');
	if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv });
	if (fs.existsSync(appEnv)) dotenv.config({ path: appEnv });
} catch (e) {
	console.warn('[provision] dotenv load skipped:', e.message || e);
}

function mapExpoPublic(name) {
	if (!process.env[name]) {
		const expoName = `EXPO_PUBLIC_${name}`;
		if (process.env[expoName]) process.env[name] = process.env[expoName];
	}
}
['APPWRITE_ENDPOINT','APPWRITE_PROJECT_ID','APPWRITE_API_KEY','APPWRITE_DATABASE_ID'].forEach(mapExpoPublic);

const { Client, Databases, Permission, Role, Storage } = require('node-appwrite');

const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID } = process.env;
if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
	console.error('Missing one of required env vars: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID');
	console.error('Loaded endpoint:', process.env.APPWRITE_ENDPOINT, 'project:', process.env.APPWRITE_PROJECT_ID, 'database:', process.env.APPWRITE_DATABASE_ID);
	process.exit(1);
}
console.info('[provision] Endpoint:', APPWRITE_ENDPOINT);
console.info('[provision] Project:', APPWRITE_PROJECT_ID);
console.info('[provision] Database:', APPWRITE_DATABASE_ID);

const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);
const databases = new Databases(client);
const storage = new Storage(client);
const db = APPWRITE_DATABASE_ID;

async function attr(kind, col, spec) {
	try {
		switch (kind) {
			case 'string':
				await databases.createStringAttribute(db, col, spec.key, spec.size ?? 255, spec.required ?? false, undefined, spec.array ?? false);break;
			case 'enum':
				await databases.createEnumAttribute(db, col, spec.key, spec.elements, spec.required ?? false, undefined, spec.array ?? false);break;
			case 'int':
				await databases.createIntegerAttribute(db, col, spec.key, spec.required ?? false, spec.min, spec.max, undefined, spec.array ?? false);break;
			case 'float':
				await databases.createFloatAttribute(db, col, spec.key, spec.required ?? false, spec.min, spec.max, undefined, spec.array ?? false);break;
			case 'bool':
				await databases.createBooleanAttribute(db, col, spec.key, spec.required ?? false, undefined, spec.array ?? false);break;
			case 'datetime':
				await databases.createDatetimeAttribute(db, col, spec.key, spec.required ?? false, undefined, spec.array ?? false);break;
		}
	} catch (e) {
		const msg = String(e?.message || e);
		if (!/already exists|attribute with the same key/i.test(msg)) console.warn(`[attr] ${col}.${spec.key}: ${msg}`);
	}
}
async function index(col, name, type, attributes, orders) {
	try {
		await databases.createIndex(db, col, name, type, attributes, orders ?? new Array(attributes.length).fill('ASC'));
	} catch (e) {
		const msg = String(e?.message || e);
		if (!/already exists|index with the same key/i.test(msg)) console.warn(`[index] ${col}.${name}: ${msg}`);
	}
}
async function ensure(col) {
	try { await databases.getCollection(db, col); } catch { throw new Error(`Collection ${col} missing. Create it first.`); }
}
async function setCollectionPermissions(col, perms, documentSecurity = true) {
	const existing = await databases.getCollection(db, col);
	const name = existing.name || col;
	const arr = [];
	const map = {
		create: Permission.create,
		read: Permission.read,
		update: Permission.update,
		delete: Permission.delete,
	};
	const role = (r) => (r === 'any' ? Role.any() : Role.users());
	for (const k of Object.keys(perms || {})) {
		arr.push(map[k](role(perms[k])));
	}
	try {
		await databases.updateCollection(db, col, name, arr, documentSecurity);
		console.log('Permissions updated for', col, arr.map(String), 'documentSecurity=' + documentSecurity);
	} catch (e) {
		console.warn(`[perms] ${col}: ${e.message}`);
	}
}
async function config(col, attrSpecs, idxSpecs) {
	await ensure(col);
	for (const a of attrSpecs) await attr(a.kind, col, a);
	for (const i of idxSpecs) await index(col, i.name, i.type, i.attributes, i.orders);
	console.log('Configured', col);
}

async function main() {
	await config('profiles', [
		{ kind:'enum', key:'role', elements:['student','teacher'], required:true },
		{ kind:'string', key:'name', required:true },
		{ kind:'string', key:'preferredName' },
		{ kind:'string', key:'avatarUrl' },
		{ kind:'string', key:'email' },
		{ kind:'datetime', key:'createdAt', required:true },
	], [
		{ name:'role_idx', type:'key', attributes:['role'] },
		{ name:'email_idx', type:'key', attributes:['email'] },
	]);
	await setCollectionPermissions('profiles', { create: 'users', read: 'users', update: 'users' });

	await config('courses', [
		{ kind:'string', key:'code', required:true },
		{ kind:'string', key:'name', required:true },
		{ kind:'string', key:'description' },
		{ kind:'string', key:'color' },
		{ kind:'string', key:'gradingRule' },
		{ kind:'string', key:'teacherIds', array:true },
		{ kind:'datetime', key:'createdAt', required:true },
	], [
		{ name:'code_unique', type:'unique', attributes:['code'] },
		{ name:'teacher_ids_idx', type:'key', attributes:['teacherIds'] },
	]);
	// Ensure storage bucket for profile avatars (public read for demo; tighten later)
	const AVATAR_BUCKET = 'profile_avatars';
	try {
		await storage.getBucket(AVATAR_BUCKET);
	} catch {
		try {
			await storage.createBucket(AVATAR_BUCKET, AVATAR_BUCKET, [
				Permission.read(Role.any()),
				Permission.create(Role.users()),
				Permission.update(Role.users()),
				Permission.delete(Role.users()),
			], true, 10 * 1024 * 1024, 'file', ['jpg','jpeg','png','webp'], false);
			console.log('Created bucket', AVATAR_BUCKET);
		} catch (e) {
			console.warn('Bucket create failed', e.message || e);
		}
	}
	// Allow authenticated users to read courses; updates are controlled per-document
	await setCollectionPermissions('courses', { read: 'users' });

	await config('enrollments', [
		{ kind:'string', key:'courseId', required:true },
		{ kind:'string', key:'userId', required:true },
		{ kind:'enum', key:'role', elements:['student','teacher'], required:true },
		{ kind:'enum', key:'status', elements:['active','archived'], required:true },
		{ kind:'datetime', key:'joinedAt', required:true },
	], [
		{ name:'course_idx', type:'key', attributes:['courseId'] },
		{ name:'user_idx', type:'key', attributes:['userId'] },
		{ name:'course_role_idx', type:'key', attributes:['courseId','role'] },
		{ name:'user_status_idx', type:'key', attributes:['userId','status'] },
	]);
	// Temporary: allow authenticated users to read enrollments
	await setCollectionPermissions('enrollments', { read: 'users', create: 'users' }, false);

	await config('lessons', [
		{ kind:'string', key:'courseId', required:true },
		{ kind:'string', key:'topic' },
		{ kind:'datetime', key:'startsAt', required:true },
		{ kind:'datetime', key:'endsAt', required:true },
	], [
		{ name:'course_idx', type:'key', attributes:['courseId'] },
		{ name:'course_starts_idx', type:'key', attributes:['courseId','startsAt'] },
	]);

	await config('attendance_events', [
		{ kind:'string', key:'courseId', required:true },
		{ kind:'string', key:'sessionId', required:true },
		{ kind:'string', key:'userId', required:true },
		{ kind:'enum', key:'status', elements:['present','late','absent','excused'], required:true },
		{ kind:'enum', key:'source', elements:['qr','manual'], required:true },
		{ kind:'string', key:'markedBy' },
		{ kind:'datetime', key:'markedAt' },
		{ kind:'string', key:'tokenId' },
	], [
		{ name:'course_idx', type:'key', attributes:['courseId'] },
		{ name:'session_idx', type:'key', attributes:['sessionId'] },
		{ name:'user_idx', type:'key', attributes:['userId'] },
		{ name:'session_user_unique', type:'unique', attributes:['sessionId','userId'] },
	]);

	await config('assessments', [
		{ kind:'string', key:'courseId', required:true },
		{ kind:'string', key:'title', required:true },
		{ kind:'enum', key:'type', elements:['assignment','test','exam'], required:true },
		{ kind:'datetime', key:'dueAt', required:true },
		{ kind:'datetime', key:'createdAt', required:true },
		{ kind:'string', key:'createdBy' },
		{ kind:'enum', key:'status', elements:['open','closed'], required:true },
		{ kind:'string', key:'rubricId' },
		// Extended attributes to support mobile app flows
		{ kind:'string', key:'description' },
		{ kind:'string', key:'bannerUrl' },
		{ kind:'string', key:'sectionsJson' },
		{ kind:'string', key:'tasksJson' },
		{ kind:'enum', key:'groupType', elements:['individual','group'] },
	], [
		{ name:'course_idx', type:'key', attributes:['courseId'] },
		{ name:'course_due_idx', type:'key', attributes:['courseId','dueAt'] },
	]);

	await config('submissions', [
		{ kind:'string', key:'assessmentId', required:true },
		{ kind:'string', key:'courseId', required:true },
		{ kind:'enum', key:'submitterType', elements:['student','group'], required:true },
		{ kind:'string', key:'submitterId', required:true },
		{ kind:'string', key:'content' },
		{ kind:'string', key:'attachments', array:true },
		{ kind:'enum', key:'status', elements:['submitted','graded','returned'], required:true },
		{ kind:'float', key:'grade' },
		{ kind:'string', key:'feedback' },
		{ kind:'datetime', key:'submittedAt', required:true },
		{ kind:'datetime', key:'gradedAt' },
		{ kind:'string', key:'gradedBy' },
	], [
		{ name:'assessment_idx', type:'key', attributes:['assessmentId'] },
		{ name:'course_idx', type:'key', attributes:['courseId'] },
		{ name:'submitter_unique', type:'unique', attributes:['assessmentId','submitterType','submitterId'] },
	]);

	await config('groups', [
		{ kind:'string', key:'courseId', required:true },
		{ kind:'string', key:'name', required:true },
		{ kind:'datetime', key:'createdAt', required:true },
	], [
		{ name:'course_idx', type:'key', attributes:['courseId'] },
	]);

	await config('group_members', [
		{ kind:'string', key:'groupId', required:true },
		{ kind:'string', key:'userId', required:true },
		{ kind:'enum', key:'role', elements:['member','lead'], required:true },
		{ kind:'datetime', key:'joinedAt', required:true },
	], [
		{ name:'group_idx', type:'key', attributes:['groupId'] },
		{ name:'user_idx', type:'key', attributes:['userId'] },
		{ name:'group_user_unique', type:'unique', attributes:['groupId','userId'] },
	]);

	await config('notes', [
		{ kind:'string', key:'courseId', required:true },
		{ kind:'string', key:'lessonId' },
		{ kind:'string', key:'title', required:true },
		{ kind:'string', key:'body' },
		{ kind:'string', key:'attachments', array:true },
		{ kind:'enum', key:'visibility', elements:['all','students','teachers'], required:true },
		{ kind:'datetime', key:'createdAt', required:true },
	], [
		{ name:'course_idx', type:'key', attributes:['courseId'] },
		{ name:'course_lesson_idx', type:'key', attributes:['courseId','lessonId'] },
	]);

	await config('notifications', [
		{ kind:'string', key:'userId', required:true },
		{ kind:'enum', key:'type', elements:['assignment_due','assignment_graded','announcement','resource_added'], required:true },
		{ kind:'string', key:'title', required:true },
		{ kind:'string', key:'subtitle' },
		{ kind:'string', key:'courseId' },
		{ kind:'string', key:'assessmentId' },
		{ kind:'datetime', key:'createdAt', required:true },
		{ kind:'bool', key:'read', required:true },
	], [
		{ name:'user_idx', type:'key', attributes:['userId'] },
		{ name:'user_read_idx', type:'key', attributes:['userId','read'] },
	]);

	// Optional collections (attempt, ignore if missing)
	const optional = [
		['activity_events', [
			{ kind:'string', key:'type', required:true },
			{ kind:'string', key:'userId' },
			{ kind:'string', key:'courseId' },
			{ kind:'string', key:'payload' },
			{ kind:'datetime', key:'createdAt', required:true },
		], [
			{ name:'type_idx', type:'key', attributes:['type'] },
			{ name:'user_idx', type:'key', attributes:['userId'] },
			{ name:'course_idx', type:'key', attributes:['courseId'] },
			{ name:'created_idx', type:'key', attributes:['createdAt'] },
		]],
		['daily_student_stats', [
			{ kind:'string', key:'userId', required:true },
			{ kind:'string', key:'date', required:true },
			{ kind:'int', key:'streakDays', required:true },
			{ kind:'float', key:'onTimeRate', required:true },
			{ kind:'int', key:'lateCount', required:true },
			{ kind:'float', key:'attendanceRate', required:true },
			{ kind:'int', key:'riskScore', required:true },
		], [
			{ name:'user_date_unique', type:'unique', attributes:['userId','date'] },
		]],
		['chat_threads', [
			{ kind:'string', key:'courseId' },
			{ kind:'string', key:'title' },
			{ kind:'string', key:'participantIds', array:true },
			{ kind:'datetime', key:'createdAt', required:true },
		], [
			{ name:'course_idx', type:'key', attributes:['courseId'] },
			{ name:'participants_idx', type:'key', attributes:['participantIds'] },
		]],
		['chat_messages', [
			{ kind:'string', key:'threadId', required:true },
			{ kind:'string', key:'userId', required:true },
			{ kind:'string', key:'text', required:true },
			{ kind:'string', key:'attachments', array:true },
			{ kind:'datetime', key:'createdAt', required:true },
			{ kind:'datetime', key:'editedAt' },
		], [
			{ name:'thread_idx', type:'key', attributes:['threadId'] },
			{ name:'thread_created_idx', type:'key', attributes:['threadId','createdAt'] },
		]]
	];
	for (const [c, a, i] of optional) {
		try { await config(c, a, i); } catch {}
	}

	console.log('Provisioning complete.');
}

main().catch(e => { console.error(e); process.exit(1); });
