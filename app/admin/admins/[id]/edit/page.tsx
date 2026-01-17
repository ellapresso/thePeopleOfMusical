'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getAdminMe, getAdminById, updateAdmin, getAllMembers } from '@/lib/adminApi';
import styles from '../../../admin.module.css';
import formStyles from '../../create/create.module.css';

export default function EditAdminPage() {
  const router = useRouter();
  const params = useParams();
  const adminId = parseInt(params.id as string);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [admin, setAdmin] = useState<any>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    adminType: 'NORMAL',
    memberId: '',
    password: '',
  });

  useEffect(() => {
    const initialize = async () => {
      const authSuccess = await checkAuth();
      if (authSuccess) {
        await loadAdmin();
      }
      setLoading(false);
    };
    initialize();
  }, [adminId]);

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
      const adminData = await getAdminMe();
      setCurrentAdmin(adminData);
      return true;
    } catch (error) {
      router.push('/admin/login');
      return false;
    }
  };

  const loadAdmin = async () => {
    try {
      const adminData = await getAdminById(adminId);
      setAdmin(adminData);
      
      // 연결된 단원이 있으면 검색어와 선택된 단원 설정
      if (adminData.member) {
        setSelectedMember(adminData.member);
        setMemberSearchQuery(adminData.member.name);
      }
      
      setFormData({
        name: adminData.name || '',
        adminType: adminData.adminType || 'NORMAL',
        memberId: adminData.memberId?.toString() || '',
        password: '',
      });
    } catch (error) {
      console.error('Failed to load admin:', error);
      router.push('/admin/admins');
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

    // admin 계정은 시스템 관리자만 수정 가능
    if (admin?.loginId === 'admin' && currentAdmin?.adminType !== 'SYSTEM') {
      setError('시스템 관리자만 admin 계정을 수정할 수 있습니다.');
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
        name: formData.name,
        adminType: formData.adminType,
      };

      if (formData.memberId) {
        payload.memberId = parseInt(formData.memberId);
      } else {
        payload.memberId = null;
      }

      // 비밀번호가 입력된 경우에만 포함
      if (formData.password) {
        payload.password = formData.password;
      }

      await updateAdmin(adminId, payload);

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/admins');
      }, 2000);
    } catch (err: any) {
      setError(err.message || '관리자 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !admin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>로딩 중...</div>
      </div>
    );
  }

  // admin 계정이고 시스템 관리자가 아니면 접근 불가
  if (admin.loginId === 'admin' && currentAdmin?.adminType !== 'SYSTEM') {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
          }}>
            <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>접근 권한 없음</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              시스템 관리자만 admin 계정을 수정할 수 있습니다.
            </p>
            <a
              href="/admin/admins"
              style={{
                padding: '10px 20px',
                background: '#667eea',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              목록으로 돌아가기
            </a>
          </div>
        </div>
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
              관리자 수정
            </h1>
            <p className={styles.headerSubtitle}>
              관리자 정보 수정
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
              ✅ 관리자 정보가 성공적으로 수정되었습니다. 목록 페이지로 이동합니다...
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

          <div style={{
            padding: '15px',
            background: '#f0f4ff',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            color: '#333',
          }}>
            <strong>아이디:</strong> {admin.loginId}
          </div>

          <form onSubmit={handleSubmit}>
            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                비밀번호 (변경 시에만 입력)
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={submitting || success}
                className={formStyles.input}
                placeholder="비밀번호를 변경하려면 입력하세요"
                minLength={4}
              />
              <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                비워두면 비밀번호가 변경되지 않습니다
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

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                관리자 타입 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <select
                name="adminType"
                value={formData.adminType}
                onChange={handleChange}
                required
                disabled={submitting || success || (admin.loginId === 'admin')}
                className={formStyles.select}
              >
                <option value="NORMAL">일반 관리자</option>
                <option value="SYSTEM">시스템 관리자</option>
              </select>
              {admin.loginId === 'admin' && (
                <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                  admin 계정의 타입은 변경할 수 없습니다
                </small>
              )}
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
                {submitting ? '수정 중...' : success ? '수정 완료' : '수정하기'}
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

