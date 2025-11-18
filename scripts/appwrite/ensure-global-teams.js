// Create global Teachers/Students teams and enroll users based on profiles.role
// Usage:
//   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=...
//   APPWRITE_DATABASE_ID=...
//   node scripts/appwrite/ensure-global-teams.js
// Output: prints team IDs you can place into .env as EXPO_PUBLIC_APPWRITE_*_TEAM_ID

const sdk = require('node-appwrite');

function req(name, v) { if (!v) throw new Error(`Missing env ${name}`); return v; }

async function findOrCreateTeam(teams, code, name) {
  // Try to find by listing teams and matching name or $id
  try {
    const res = await teams.list();
    const hit = res.teams?.find(t => t.name === name || t.$id === code);
    if (hit) return hit;
  } catch {}
  // Create
  try {
    return await teams.create(code, name);
  } catch (e) {
    // If already exists due to concurrent run, fetch by id
    try { return await teams.get(code); } catch {}
    throw e;
  }
}

async function listUsersByRole(db, DB_ID, role) {
  try {
    const res = await db.listDocuments(DB_ID, 'profiles', [sdk.Query.equal('role', [role]), sdk.Query.limit(200)]);
    return res.documents.map(d => ({ id: d.$id, email: d.email })).filter(x => !!x.email);
  } catch {
    return [];
  }
}

async function ensureMember(teams, teamId, userId, email) {
  // Flow: createMembership -> updateMembershipStatus (auto-accept)
  try {
    const url = 'https://example.com/accept';
    let membership;
    try {
      // SDK v20 style
      membership = await teams.createMembership({ teamId, roles: ['member'], email, url });
    } catch (e) {
      try {
        // Legacy signature
        membership = await teams.createMembership(teamId, email, ['member'], url);
      } catch (e2) {
        // If membership exists, nothing to do
        const existing = await teams.listMemberships(teamId);
        if (existing.total && existing.memberships.some(m => m.userId === userId)) return;
        throw e2;
      }
    }
    // Accept the invitation on behalf of the user
    const secret = membership?.secret;
    const membershipId = membership?.$id;
    if (secret && membershipId) {
      try {
        await teams.updateMembershipStatus(teamId, membershipId, userId, secret);
      } catch {}
    }
  } catch {}
}

async function main() {
  const endpoint = req('APPWRITE_ENDPOINT', (process.env.APPWRITE_ENDPOINT || '').replace(/\/$/, ''));
  const project = req('APPWRITE_PROJECT_ID', process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);
  const key = req('APPWRITE_API_KEY', process.env.APPWRITE_API_KEY);
  const DB_ID = req('APPWRITE_DATABASE_ID', process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID);

  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const teams = new sdk.Teams(client);
  const db = new sdk.Databases(client);

  const teachersCode = 'teachers_global';
  const studentsCode = 'students_global';
  const t = await findOrCreateTeam(teams, teachersCode, 'Teachers');
  const s = await findOrCreateTeam(teams, studentsCode, 'Students');
  console.log('[teams] Teachers:', t.$id, 'Students:', s.$id);

  const teachers = await listUsersByRole(db, DB_ID, 'teacher');
  const students = await listUsersByRole(db, DB_ID, 'student');
  console.log(`[teams] Enrolling teachers=${teachers.length} students=${students.length}`);

  for (const u of teachers) await ensureMember(teams, t.$id, u.id, u.email);
  for (const u of students) await ensureMember(teams, s.$id, u.id, u.email);

  console.log('\nSet these in .env:');
  console.log('EXPO_PUBLIC_APPWRITE_TEACHER_TEAM_ID=' + t.$id);
  console.log('EXPO_PUBLIC_APPWRITE_STUDENT_TEAM_ID=' + s.$id);
}

main().catch(e => { console.error(e); process.exit(1); });
