/**
 * Kolibri PLASTER Module - Photo Upload Screen (React Native)
 * Экран загрузки фото прогресса работ
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

// Types
interface Photo {
  uri: string;
  type: string;
  fileName: string;
}

interface PhotoUploadScreenProps {
  navigation: any;
  route: {
    params: {
      taskId?: string;
      projectId?: string;
      stageId?: string;
      photoType?: 'before' | 'progress' | 'after' | 'defect' | 'quality';
    };
  };
}

const photoTypeLabels: Record<string, { title: string; icon: string; color: string }> = {
  before: { title: 'До начала работ', icon: '🏚️', color: '#3B82F6' },
  progress: { title: 'Прогресс', icon: '🔨', color: '#F59E0B' },
  after: { title: 'После завершения', icon: '✨', color: '#10B981' },
  defect: { title: 'Дефект', icon: '⚠️', color: '#EF4444' },
  quality: { title: 'Контроль качества', icon: '✅', color: '#8B5CF6' },
};

export const PhotoUploadScreen: React.FC<PhotoUploadScreenProps> = ({
  navigation,
  route,
}) => {
  const { taskId, projectId, stageId, photoType = 'progress' } = route.params || {};
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedType, setSelectedType] = useState(photoType);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const typeInfo = photoTypeLabels[selectedType];

  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: true,
        includeBase64: false,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setPhotos(prev => [
          ...prev,
          {
            uri: asset.uri || '',
            type: asset.type || 'image/jpeg',
            fileName: asset.fileName || `photo_${Date.now()}.jpg`,
          },
        ]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 5,
      });

      if (result.assets) {
        const newPhotos = result.assets.map(asset => ({
          uri: asset.uri || '',
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        }));
        setPhotos(prev => [...prev, ...newPhotos]);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать фото');
    }
  };

  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'Удалить фото',
      'Удалить это фото?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            setPhotos(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const handleUpload = async () => {
    if (photos.length === 0) {
      Alert.alert('Внимание', 'Добавьте хотя бы одно фото');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadProgress(i);
      }

      // Here would be actual API upload
      /*
      const formData = new FormData();
      photos.forEach((photo, index) => {
        formData.append('photos', {
          uri: photo.uri,
          type: photo.type,
          name: photo.fileName,
        });
      });
      formData.append('photo_type', selectedType);
      formData.append('description', description);
      if (projectId) formData.append('project_id', projectId);
      if (taskId) formData.append('task_id', taskId);
      if (stageId) formData.append('stage_id', stageId);

      await fetch('/api/plaster/quality/photo', {
        method: 'POST',
        body: formData,
      });
      */

      Alert.alert(
        'Успешно',
        `Загружено ${photos.length} фото`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить фото');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const renderTypeSelector = () => (
    <View style={styles.typeSelector}>
      <Text style={styles.sectionTitle}>Тип фото</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.typeButtons}>
          {Object.entries(photoTypeLabels).map(([type, info]) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                selectedType === type && { backgroundColor: info.color + '20', borderColor: info.color },
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={styles.typeIcon}>{info.icon}</Text>
              <Text style={[
                styles.typeLabel,
                selectedType === type && { color: info.color },
              ]}>
                {info.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderPhotoGrid = () => (
    <View style={styles.photoGrid}>
      {photos.map((photo, index) => (
        <View key={index} style={styles.photoContainer}>
          <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemovePhoto(index)}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      
      {photos.length < 10 && (
        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={() => {
            Alert.alert(
              'Добавить фото',
              'Выберите источник',
              [
                { text: 'Камера', onPress: handleTakePhoto },
                { text: 'Галерея', onPress: handleSelectFromGallery },
                { text: 'Отмена', style: 'cancel' },
              ]
            );
          }}
        >
          <Text style={styles.addPhotoIcon}>📷</Text>
          <Text style={styles.addPhotoText}>Добавить</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: typeInfo.color }]}>
        <Text style={styles.headerIcon}>{typeInfo.icon}</Text>
        <Text style={styles.headerTitle}>Загрузка фото</Text>
        <Text style={styles.headerSubtitle}>{typeInfo.title}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Type Selector */}
        {renderTypeSelector()}

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Фотографии ({photos.length}/10)
          </Text>
          {renderPhotoGrid()}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Описание (опционально)</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Добавьте описание к фото..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Quick Actions for Defects */}
        {selectedType === 'defect' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Тип дефекта</Text>
            <View style={styles.defectTypes}>
              {[
                { id: 'crack', label: 'Трещина', icon: '➰' },
                { id: 'chip', label: 'Скол', icon: '💔' },
                { id: 'unevenness', label: 'Неровность', icon: '📐' },
                { id: 'delamination', label: 'Отслоение', icon: '📃' },
                { id: 'other', label: 'Другое', icon: '❓' },
              ].map(defect => (
                <TouchableOpacity
                  key={defect.id}
                  style={styles.defectButton}
                  onPress={() => setDescription(prev => prev + ` [${defect.label}]`)}
                >
                  <Text style={styles.defectIcon}>{defect.icon}</Text>
                  <Text style={styles.defectLabel}>{defect.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Советы</Text>
          <Text style={styles.tipText}>• Делайте фото при хорошем освещении</Text>
          <Text style={styles.tipText}>• Захватывайте всю область работ</Text>
          <Text style={styles.tipText}>• Для дефектов - фото крупным планом</Text>
        </View>
      </ScrollView>

      {/* Upload Button */}
      <View style={styles.footer}>
        {uploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.uploadingText}>
              Загрузка... {uploadProgress}%
            </Text>
            <View style={styles.uploadProgressBar}>
              <View
                style={[styles.uploadProgressFill, { width: `${uploadProgress}%` }]}
              />
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.uploadButton,
              photos.length === 0 && styles.uploadButtonDisabled,
            ]}
            onPress={handleUpload}
            disabled={photos.length === 0}
          >
            <Text style={styles.uploadButtonText}>
              📤 Загрузить {photos.length > 0 ? `(${photos.length})` : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  typeSelector: {
    marginBottom: 24,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  typeIcon: {
    fontSize: 18,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  addPhotoIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  descriptionInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  defectTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  defectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    gap: 4,
  },
  defectIcon: {
    fontSize: 16,
  },
  defectLabel: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '500',
  },
  tipsSection: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#3B82F6',
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  uploadButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  uploadingContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  uploadingText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
  },
  uploadProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
});

export default PhotoUploadScreen;
