'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllMembers } from '@/lib/adminApi';
import { useAdmin } from '@/contexts/AdminContext';
import styles from '../admin.module.css';

export default function MembersPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAdmin();
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 인증 확인 (Context에서 처리됨)
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    // 데이터 로딩은 백그라운드에서 처리 (즉시 UI 표시)
    if (isAuthenticated) {
      loadMembers();
    }
  }, [isAuthenticated, authLoading]);

  const loadMembers = async () => {
    try {
      const data = await getAllMembers();
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              단원 정보
            </h1>
            <p className={styles.headerSubtitle}>
              등록된 단원 정보 관리
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link
              href="/admin/dashboard"
              style={{
                padding: '10px 20px',
                background: '#f5f5f5',
                color: '#333',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              대시보드
            </Link>
            <Link
              href="/admin/members/create"
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              + 단원 등록
            </Link>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedMember ? '1fr 400px' : '1fr',
          gap: '20px',
        }} className="members-layout">
          {/* 단원 목록 */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}>
            {/* 검색 */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="단원 이름으로 검색..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 단원 목록 */}
            {filteredMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                {searchQuery ? '검색 결과가 없습니다.' : '등록된 단원이 없습니다.'}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '12px',
                maxHeight: '70vh',
                overflowY: 'auto',
              }}>
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    style={{
                      padding: '15px',
                      border: selectedMember?.id === member.id ? '2px solid #667eea' : '1px solid #e0e0e0',
                      borderRadius: '8px',
                      background: selectedMember?.id === member.id ? '#f0f4ff' : '#f9f9f9',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedMember?.id !== member.id) {
                        e.currentTarget.style.background = '#f0f0f0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedMember?.id !== member.id) {
                        e.currentTarget.style.background = '#f9f9f9';
                      }
                    }}
                  >
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '5px',
                    }}>
                      {member.name}
                    </div>
                    <div style={{
                      color: '#666',
                      fontSize: '0.9rem',
                    }}>
                      {member.memberLevel?.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 단원 상세 정보 */}
          {selectedMember && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              position: 'sticky',
              top: '20px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  margin: 0,
                  color: '#333',
                }}>
                  {selectedMember.name}
                </h2>
                <button
                  onClick={() => setSelectedMember(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#999',
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{
                display: 'grid',
                gap: '15px',
              }}>
                <DetailRow label="생년월일" value={new Date(selectedMember.birthDate).toLocaleDateString('ko-KR')} />
                <DetailRow label="전화번호" value={selectedMember.phone || '-'} />
                <DetailRow label="단원 레벨" value={selectedMember.memberLevel?.name || '-'} />
                <DetailRow label="프로필 공개" value={selectedMember.profileVisible ? '공개' : '비공개'} />
                <DetailRow label="첫 가입일" value={new Date(selectedMember.firstJoinedAt).toLocaleDateString('ko-KR')} />
              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '25px',
                paddingTop: '25px',
                borderTop: '1px solid #e0e0e0',
              }}>
                <Link
                  href={`/admin/members/${selectedMember.id}/edit`}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#667eea',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  수정
                </Link>
                <button
                  onClick={() => {
                    if (confirm(`정말로 "${selectedMember.name}" 단원을 삭제하시겠습니까?`)) {
                      // 삭제 로직 (추후 구현)
                      alert('삭제 기능은 추후 구현 예정입니다.');
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      paddingBottom: '10px',
      borderBottom: '1px solid #f0f0f0',
    }}>
      <span style={{ color: '#666', fontSize: '0.9rem' }}>{label}</span>
      <span style={{ color: '#333', fontSize: '0.9rem', fontWeight: '500' }}>{value}</span>
    </div>
  );
}

