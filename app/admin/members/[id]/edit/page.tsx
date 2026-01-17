'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getAdminMe, getMemberById, updateMember, getAllMemberLevels } from '@/lib/adminApi';
import styles from '../../../admin.module.css';
import formStyles from '../../create/create.module.css';

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = parseInt(params.id as string);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [memberLevels, setMemberLevels] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    phone: '',
    memberLevelId: '',
    profileVisible: true,
    firstJoinedAt: '',
  });

  useEffect(() => {
    const initialize = async () => {
      const authSuccess = await checkAuth();
      if (authSuccess) {
        await Promise.all([loadOptions(), loadMember()]);
      }
      setLoading(false);
    };
    initialize();
  }, [memberId]);

  const checkAuth = async () => {
    try {
      await getAdminMe();
      return true;
    } catch (error) {
      router.push('/admin/login');
      return false;
    }
  };

  const loadOptions = async () => {
    try {
      const levels = await getAllMemberLevels();
      setMemberLevels(levels);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const loadMember = async () => {
    try {
      const data = await getMemberById(memberId);
      
      // 날짜를 YYYY-MM-DD 형식으로 변환
      const birthDate = new Date(data.birthDate);
      const firstJoinedAt = new Date(data.firstJoinedAt);
      
      setFormData({
        name: data.name,
        birthDate: birthDate.toISOString().split('T')[0],
        phone: data.phone || '',
        memberLevelId: data.memberLevelId.toString(),
        profileVisible: data.profileVisible,
        firstJoinedAt: firstJoinedAt.toISOString().split('T')[0],
      });
    } catch (error: any) {
      setError(error.message || '단원 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.birthDate || !formData.memberLevelId || !formData.firstJoinedAt) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      await updateMember(memberId, {
        name: formData.name,
        birthDate: new Date(formData.birthDate).toISOString(),
        phone: formData.phone || null,
        memberLevelId: parseInt(formData.memberLevelId),
        profileVisible: formData.profileVisible,
        firstJoinedAt: new Date(formData.firstJoinedAt).toISOString(),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/members');
      }, 2000);
    } catch (err: any) {
      setError(err.message || '단원 정보 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 헤더 */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>
              단원 정보 수정
            </h1>
            <p className={styles.headerSubtitle}>
              단원 정보를 수정합니다
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link
              href="/admin/members"
              style={{
                padding: '10px 20px',
                background: '#f5f5f5',
                color: '#333',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              ← 목록으로
            </Link>
          </div>
        </div>

        {/* 폼 */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}>
          {success && (
            <div style={{
              padding: '15px',
              background: '#d4edda',
              color: '#155724',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #c3e6cb',
            }}>
              ✅ 단원 정보가 성공적으로 수정되었습니다. 목록 페이지로 이동합니다...
            </div>
          )}

          {error && (
            <div style={{
              padding: '15px',
              background: '#f8d7da',
              color: '#721c24',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #f5c6cb',
            }}>
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                이름 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={submitting || success}
                className={formStyles.input}
                placeholder="단원 이름"
              />
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                생년월일 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                required
                disabled={submitting || success}
                className={formStyles.input}
              />
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                전화번호
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={submitting || success}
                className={formStyles.input}
                placeholder="010-1234-5678"
              />
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                단원 레벨 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <select
                name="memberLevelId"
                value={formData.memberLevelId}
                onChange={handleChange}
                required
                disabled={submitting || success || memberLevels.length === 0}
                className={formStyles.select}
              >
                <option value="">선택하세요</option>
                {memberLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                첫 가입일 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="date"
                name="firstJoinedAt"
                value={formData.firstJoinedAt}
                onChange={handleChange}
                required
                disabled={submitting || success}
                className={formStyles.input}
              />
            </div>

            <div className={formStyles.formGroup}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  name="profileVisible"
                  checked={formData.profileVisible}
                  onChange={handleChange}
                  disabled={submitting || success}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                  }}
                />
                <span className={formStyles.label}>
                  프로필 공개
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button
                type="submit"
                disabled={submitting || success}
                className={formStyles.submitButton}
              >
                {submitting ? '수정 중...' : success ? '수정 완료' : '단원 정보 수정'}
              </button>
              <Link
                href="/admin/members"
                style={{
                  padding: '14px 30px',
                  background: '#f5f5f5',
                  color: '#333',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                취소
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

