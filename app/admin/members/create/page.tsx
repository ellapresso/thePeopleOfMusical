'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminMe, createMember, getAllMemberLevels } from '@/lib/adminApi';
import styles from '../../admin.module.css';
import formStyles from './create.module.css';

export default function CreateMemberPage() {
  const router = useRouter();
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
    checkAuth();
    loadOptions();
  }, []);

  const checkAuth = async () => {
    try {
      await getAdminMe();
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setLoading(false);
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
      await createMember({
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
      setError(err.message || '단원 등록에 실패했습니다.');
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
              단원 등록
            </h1>
            <p className={styles.headerSubtitle}>
              새로운 단원을 등록합니다
            </p>
          </div>
          <div className={styles.headerActions}>
            <a
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
            </a>
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
              ✅ 단원이 성공적으로 등록되었습니다. 목록 페이지로 이동합니다...
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
                {submitting ? '등록 중...' : success ? '등록 완료' : '단원 등록'}
              </button>
              <a
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
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

