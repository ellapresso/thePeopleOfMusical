'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createRegularMeetingSchedule, getAllMembers } from '@/lib/adminApi';
import { useAdmin } from '@/contexts/AdminContext';
import styles from '../../admin.module.css';

export default function CreateRegularMeetingPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAdmin();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [managerSearchQuery, setManagerSearchQuery] = useState('');
  const [managerSearchResults, setManagerSearchResults] = useState<any[]>([]);
  const [showManagerSearch, setShowManagerSearch] = useState(false);
  const [selectedManager, setSelectedManager] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    meetingName: '',
    meetingDate: '',
    startTime: '',
    endTime: '',
    managerId: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    if (isAuthenticated) {
      loadMembers();
    }
  }, [isAuthenticated, authLoading]);

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const data = await getAllMembers();
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleManagerSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManagerSearchQuery(value);
    // 검색어가 변경되면 검색 결과 초기화
    if (value.length < 2) {
      setManagerSearchResults([]);
      setShowManagerSearch(false);
    }
  };

  const handleManagerSearch = async () => {
    const query = managerSearchQuery.trim();
    if (query.length < 2) {
      setManagerSearchResults([]);
      setShowManagerSearch(false);
      return;
    }

    try {
      const filtered = members.filter((member: any) =>
        member.name.toLowerCase().includes(query.toLowerCase())
      );
      setManagerSearchResults(filtered);
      setShowManagerSearch(true);
    } catch (error) {
      console.error('Failed to search members:', error);
      setManagerSearchResults([]);
    }
  };

  const handleManagerSelect = (member: any) => {
    setSelectedManager(member);
    setFormData(prev => ({
      ...prev,
      managerId: member.id.toString(),
    }));
    setManagerSearchQuery(member.name);
    setShowManagerSearch(false);
    setManagerSearchResults([]);
  };

  const handleManagerClear = () => {
    setSelectedManager(null);
    setFormData(prev => ({
      ...prev,
      managerId: '',
    }));
    setManagerSearchQuery('');
    setShowManagerSearch(false);
    setManagerSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.meetingName || !formData.meetingDate || !formData.startTime || !formData.endTime) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    const startTimeObj = new Date(`2000-01-01T${formData.startTime}`);
    const endTimeObj = new Date(`2000-01-01T${formData.endTime}`);
    if (endTimeObj <= startTimeObj) {
      setError('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    setSubmitting(true);

    try {
      await createRegularMeetingSchedule({
        meetingName: formData.meetingName,
        meetingDate: formData.meetingDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        managerId: formData.managerId ? parseInt(formData.managerId) : null,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/regular-meetings');
      }, 2000);
    } catch (err: any) {
      setError(err.message || '정기 모임 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>정기 모임 등록</h1>
            <p className={styles.headerSubtitle}>새로운 정기 모임을 등록합니다</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/admin/regular-meetings" style={{
              padding: '10px 20px',
              background: '#f5f5f5',
              color: '#333',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}>
              ← 목록으로
            </Link>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}>
          {success && (
            <div style={{
              padding: '15px',
              background: '#d4edda',
              color: '#155724',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              정기 모임이 성공적으로 등록되었습니다. 목록 페이지로 이동합니다...
            </div>
          )}
          {error && (
            <div style={{
              padding: '15px',
              background: '#f8d7da',
              color: '#721c24',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#333',
                fontSize: '0.95rem',
              }}>
                모임명 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                name="meetingName"
                value={formData.meetingName}
                onChange={handleChange}
                required
                disabled={submitting || success}
                placeholder="예: 2024년 1월 정기 모임"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#333',
                fontSize: '0.95rem',
              }}>
                모임일 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="date"
                name="meetingDate"
                value={formData.meetingDate}
                onChange={handleChange}
                required
                disabled={submitting || success}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#333',
                fontSize: '0.95rem',
              }}>
                시작 시간 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                disabled={submitting || success}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#333',
                fontSize: '0.95rem',
              }}>
                종료 시간 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                disabled={submitting || success}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px', position: 'relative' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#333',
                fontSize: '0.95rem',
              }}>
                담당자
              </label>
              <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={managerSearchQuery}
                  onChange={handleManagerSearchInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleManagerSearch();
                    }
                  }}
                  disabled={submitting || success || loadingMembers}
                  placeholder="담당자 이름을 검색하세요 (최소 2자 이상)"
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                  }}
                />
                <button
                  type="button"
                  onClick={handleManagerSearch}
                  disabled={submitting || success || loadingMembers || managerSearchQuery.trim().length < 2}
                  style={{
                    padding: '12px 20px',
                    background: managerSearchQuery.trim().length >= 2 ? '#667eea' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: managerSearchQuery.trim().length >= 2 ? 'pointer' : 'not-allowed',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                  }}
                >
                  검색
                </button>
                {selectedManager && (
                  <button
                    type="button"
                    onClick={handleManagerClear}
                    disabled={submitting || success}
                    style={{
                      padding: '12px 20px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    취소
                  </button>
                )}
              </div>
              {showManagerSearch && managerSearchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  marginTop: '5px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}>
                  {managerSearchResults.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleManagerSelect(member)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      {member.name}
                    </div>
                  ))}
                </div>
              )}
              {showManagerSearch && managerSearchResults.length === 0 && managerSearchQuery.trim().length >= 2 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  marginTop: '5px',
                  padding: '20px',
                  textAlign: 'center',
                  color: '#999',
                  zIndex: 1000,
                }}>
                  검색 결과가 없습니다.
                </div>
              )}
              {selectedManager && (
                <div style={{
                  marginTop: '8px',
                  padding: '10px',
                  background: '#f0f7ff',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  color: '#333',
                }}>
                  선택된 담당자: <strong>{selectedManager.name}</strong>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '30px',
            }}>
              <Link href="/admin/regular-meetings" style={{
                padding: '12px 24px',
                background: '#f5f5f5',
                color: '#333',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.95rem',
              }}>
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
                  cursor: submitting || success ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
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

