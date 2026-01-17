'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminMe, getAllMembers } from '@/lib/adminApi';
import styles from '../../admin.module.css';
import formStyles from './create.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function CreateAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    name: '',
    adminType: 'NORMAL',
    memberId: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.member-search-container')) {
        setShowMemberSearch(false);
      }
    };

    if (showMemberSearch) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMemberSearch]);

  const checkAuth = async () => {
    try {
      await getAdminMe();
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMemberSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMemberSearchQuery(value);
    // 검색어가 변경되면 검색 결과 초기화
    if (value.length < 2) {
      setMemberSearchResults([]);
      setShowMemberSearch(false);
    }
  };

  const handleMemberSearch = async () => {
    const query = memberSearchQuery.trim();
    if (query.length < 2) {
      setMemberSearchResults([]);
      setShowMemberSearch(false);
      return;
    }

    try {
      const members = await getAllMembers();
      const filtered = members.filter((member: any) =>
        member.name.toLowerCase().includes(query.toLowerCase())
      );
      setMemberSearchResults(filtered);
      setShowMemberSearch(true);
    } catch (error) {
      console.error('Failed to search members:', error);
      setMemberSearchResults([]);
    }
  };

  const handleMemberSelect = (member: any) => {
    setSelectedMember(member);
    setFormData(prev => ({
      ...prev,
      memberId: member.id.toString(),
    }));
    setMemberSearchQuery(member.name);
    setShowMemberSearch(false);
    setMemberSearchResults([]);
  };

  const handleMemberClear = () => {
    setSelectedMember(null);
    setFormData(prev => ({
      ...prev,
      memberId: '',
    }));
    setMemberSearchQuery('');
    setShowMemberSearch(false);
    setMemberSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');
      const payload: any = {
        loginId: formData.loginId,
        password: formData.password,
        name: formData.name,
        adminType: 'NORMAL', // 항상 일반 관리자로만 등록
      };

      if (formData.memberId) {
        payload.memberId = parseInt(formData.memberId);
      }

      const response = await fetch(`${API_BASE_URL}/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '관리자 생성 실패');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/admins');
      }, 2000);
    } catch (err: any) {
      setError(err.message || '관리자 생성에 실패했습니다.');
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
              관리자 등록
            </h1>
            <p className={styles.headerSubtitle}>
              새로운 관리자 계정을 생성합니다
            </p>
          </div>
          <div className={styles.headerActions}>
            <a
              href="/admin/admins"
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
              ✅ 관리자가 성공적으로 생성되었습니다. 목록 페이지로 이동합니다...
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
                아이디 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                name="loginId"
                value={formData.loginId}
                onChange={handleChange}
                required
                disabled={submitting || success}
                className={formStyles.input}
                placeholder="관리자 로그인 아이디"
              />
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                비밀번호 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={submitting || success}
                className={formStyles.input}
                placeholder="비밀번호"
                minLength={4}
              />
              <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                최소 4자 이상 입력해주세요
              </small>
            </div>

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
                placeholder="관리자 이름"
              />
            </div>


            <div className={`${formStyles.formGroup} member-search-container`} style={{ position: 'relative' }}>
              <label className={formStyles.label}>
                단원 연결 (선택사항)
              </label>
              <div style={{ position: 'relative', display: 'flex', gap: '8px' }} className="member-search-container">
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={handleMemberSearchInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleMemberSearch();
                    }
                  }}
                  disabled={submitting || success}
                  className={formStyles.input}
                  placeholder="단원 이름을 검색하세요 (최소 2자 이상)"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleMemberSearch}
                  disabled={submitting || success || memberSearchQuery.trim().length < 2}
                  style={{
                    padding: '10px 20px',
                    background: memberSearchQuery.trim().length >= 2 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: memberSearchQuery.trim().length >= 2 ? 'pointer' : 'not-allowed',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                  }}
                >
                  검색
                </button>
                {selectedMember && (
                  <button
                    type="button"
                    onClick={handleMemberClear}
                    disabled={submitting || success}
                    style={{
                      padding: '10px 16px',
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
              {showMemberSearch && memberSearchResults.length > 0 && (
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
                  {memberSearchResults.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleMemberSelect(member)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f0f4ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                      }}
                    >
                      <div style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#333',
                        marginBottom: '4px',
                      }}>
                        {member.name}
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#666',
                      }}>
                        {member.memberLevel?.name} · {member.role?.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showMemberSearch && memberSearchResults.length === 0 && memberSearchQuery.length >= 2 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  marginTop: '5px',
                  padding: '12px 16px',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  color: '#666',
                  fontSize: '0.9rem',
                }}>
                  검색 결과가 없습니다.
                </div>
              )}
              {selectedMember && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: '#f0f4ff',
                  borderRadius: '8px',
                  border: '1px solid #667eea',
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#333', fontWeight: '600' }}>
                    선택된 단원: {selectedMember.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                    {selectedMember.memberLevel?.name} · {selectedMember.role?.name}
                  </div>
                </div>
              )}
              <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                단원 겸 관리자인 경우에만 검색하여 선택
              </small>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button
                type="submit"
                disabled={submitting || success}
                className={formStyles.submitButton}
              >
                {submitting ? '생성 중...' : success ? '생성 완료' : '관리자 생성'}
              </button>
              <a
                href="/admin/admins"
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

