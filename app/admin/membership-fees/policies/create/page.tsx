'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createMembershipFeePolicy, getAllMemberLevels } from '@/lib/adminApi';
import { useAdmin } from '@/contexts/AdminContext';
import styles from '../../../admin.module.css';

export default function CreateMembershipFeePolicyPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAdmin();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [memberLevels, setMemberLevels] = useState<any[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(true);
  
  const [formData, setFormData] = useState({
    memberLevelId: '',
    baseAmount: '',
    description: '',
  });

  useEffect(() => {
    // 인증 확인 (Context에서 처리됨)
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    // 데이터 로딩은 백그라운드에서 처리
    if (isAuthenticated) {
      loadOptions();
    }
  }, [isAuthenticated, authLoading]);

  const loadOptions = async () => {
    try {
      setLoadingLevels(true);
      const levels = await getAllMemberLevels();
      setMemberLevels(levels);
      if (levels.length === 0) {
        setError('등록된 단원 레벨이 없습니다. 먼저 단원 레벨을 등록해주세요.');
      }
    } catch (error: any) {
      console.error('Failed to load options:', error);
      setError('단원 레벨 목록을 불러오는데 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setLoadingLevels(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.memberLevelId || formData.baseAmount === '') {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    const baseAmountNum = parseFloat(formData.baseAmount);
    if (isNaN(baseAmountNum) || baseAmountNum < 0) {
      setError('0원 이상의 금액을 입력해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      await createMembershipFeePolicy({
        memberLevelId: parseInt(formData.memberLevelId),
        baseAmount: baseAmountNum,
        description: formData.description || null,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/membership-fees');
      }, 2000);
    } catch (err: any) {
      setError(err.message || '회비 정책 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 인증 로딩이 완료되지 않았을 때만 로딩 화면 표시
  if (authLoading) {
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
              회비 정책 등록
            </h1>
            <p className={styles.headerSubtitle}>
              새로운 회비 정책을 등록합니다
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link
              href="/admin/membership-fees"
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
              ✅ 회비 정책이 성공적으로 등록되었습니다. 목록 페이지로 이동합니다...
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
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#333',
              }}>
                단원 레벨 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              {loadingLevels ? (
                <div style={{
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  fontSize: '0.95rem',
                }}>
                  단원 레벨 목록을 불러오는 중...
                </div>
              ) : (
                <select
                  name="memberLevelId"
                  value={formData.memberLevelId}
                  onChange={handleChange}
                  required
                  disabled={submitting || success || memberLevels.length === 0}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    backgroundColor: submitting || success || memberLevels.length === 0 ? '#f5f5f5' : 'white',
                    cursor: submitting || success || memberLevels.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <option value="">선택하세요</option>
                  {memberLevels.map((level) => (
                    <option key={level.id} value={String(level.id)}>
                      {level.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#333',
              }}>
                기본 금액 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  name="baseAmount"
                  value={formData.baseAmount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="1000"
                  disabled={submitting || success}
                  placeholder="예: 50000"
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                  }}
                />
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#666',
                  fontSize: '0.9rem',
                }}>
                  원
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#333',
              }}>
                설명
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={submitting || success}
                rows={4}
                placeholder="회비 정책에 대한 설명을 입력하세요 (선택사항)"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '32px',
            }}>
              <Link
                href="/admin/membership-fees"
                style={{
                  padding: '12px 24px',
                  background: '#f5f5f5',
                  color: '#333',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  display: 'inline-block',
                }}
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={submitting || success}
                style={{
                  padding: '12px 24px',
                  background: submitting || success ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: submitting || success ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

