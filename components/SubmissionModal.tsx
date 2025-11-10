import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import type { Attachment } from '@/store/submissions';

export type SubmissionModalProps = {
  visible: boolean;
  title?: string;
  initialContent?: string;
  onClose: () => void;
  onSubmit: (content: string, attachments: Attachment[]) => void;
  readOnly?: boolean;
  existing?: { content?: string; attachments?: Attachment[] } | null;
};

export default function SubmissionModal({ visible, title = 'Submit work', initialContent = '', onClose, onSubmit, readOnly = false, existing }: SubmissionModalProps) {
  const [content, setContent] = useState<string>(initialContent);
  const [attachments, setAttachments] = useState<Attachment[]>(existing?.attachments || []);

  const pickAttachments = async () => {
    try {
      const res: any = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true, type: '*/*' });
      const picked: Attachment[] = [];
      if (res?.assets && Array.isArray(res.assets)) {
        for (const a of res.assets) picked.push({ uri: a.uri, name: a.name, mimeType: a.mimeType, size: a.size });
      } else if (res?.type === 'success') {
        picked.push({ uri: res.uri, name: res.name, mimeType: res.mimeType, size: res.size });
      } else {
        return;
      }
      if (picked.length > 0) setAttachments((prev) => [ ...prev, ...picked ]);
    } catch (_) {}
  };

  const removeAttachment = (idx: number) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const submit = () => {
    onSubmit(content.trim(), attachments);
    setContent('');
    setAttachments([]);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85%' }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {readOnly ? (
              <Text style={{ color: '#111827' }}>{existing?.content || '—'}</Text>
            ) : (
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Write your submission..."
                placeholderTextColor="#9CA3AF"
                multiline
                style={{ minHeight: 120, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, color: '#111827' }}
              />
            )}

            <View style={{ marginTop: 12 }}>
              {readOnly ? null : (
                <Pressable onPress={pickAttachments} style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' }}>
                  <Text style={{ color: '#111827' }}>Attach files/images</Text>
                </Pressable>
              )}
              {attachments.length > 0 && (
                <View style={{ gap: 8, marginTop: 12 }}>
                  {attachments.map((a, i) => (
                    <View key={`${a.uri}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, backgroundColor: '#fafafa' }}>
                      <Text style={{ flex: 1, color: '#374151' }} numberOfLines={1}>{a.name ?? a.uri.split('/').pop()}</Text>
                      {!readOnly && (
                        <Pressable onPress={() => removeAttachment(i)}>
                          <Text style={{ color: '#ef4444', fontSize: 12 }}>Remove</Text>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {readOnly ? null : (
            <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <Pressable onPress={onClose} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                <Text style={{ color: '#6b7280' }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={submit} style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#059669', borderRadius: 10 }}>
                <Text style={{ color: 'white', fontWeight: '600' }}>Submit</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
