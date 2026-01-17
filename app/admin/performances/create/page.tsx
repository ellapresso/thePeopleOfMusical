'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminMe, createPerformance } from '@/lib/adminApi';
import styles from '../../admin.module.css';
import formStyles from './create.module.css';

export default function CreatePerformancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    checkAuth();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.startDate || !formData.endDate) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    // 종료일이 시작일보다 이전이면 에러
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('종료일은 시작일보다 이후여야 합니다.');
      return;
    }

    setSubmitting(true);

    try {
      await createPerformance({
        title: formData.title,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/performances');
      }, 2000);
    } catch (err: any) {
      setError(err.message || '공연 등록에 실패했습니다.');
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
              공연 등록
            </h1>
            <p className={styles.headerSubtitle}>
              새로운 공연을 등록합니다
            </p>
          </div>
          <div className={styles.headerActions}>
            <a
              href="/admin/performances"
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
              ✅ 공연이 성공적으로 등록되었습니다. 목록 페이지로 이동합니다...
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
                공연 제목 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={submitting || success}
                className={formStyles.input}
                placeholder="공연 제목을 입력하세요"
              />
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                시작일 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                disabled={submitting || success}
                className={formStyles.input}
              />
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                종료일 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                disabled={submitting || success}
                className={formStyles.input}
                min={formData.startDate || undefined}
              />
              <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                종료일은 시작일보다 이후여야 합니다.
              </small>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button
                type="submit"
                disabled={submitting || success}
                className={formStyles.submitButton}
              >
                {submitting ? '등록 중...' : success ? '등록 완료' : '공연 등록'}
              </button>
              <a
                href="/admin/performances"
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

