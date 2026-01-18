'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllPerformances, getPerformanceById, deletePerformance } from '@/lib/adminApi';
import { useAdmin } from '@/contexts/AdminContext';
import styles from '../admin.module.css';

export default function PerformancesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAdmin();
  const [performances, setPerformances] = useState<any[]>([]);
  const [selectedPerformance, setSelectedPerformance] = useState<any>(null);

  const loadPerformances = useCallback(async () => {
    try {
      const data = await getAllPerformances();
      setPerformances(data);
    } catch (error) {
      console.error('Failed to load performances:', error);
    }
  }, []);

  useEffect(() => {
    // 인증 확인 (Context에서 처리됨)
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    // 데이터 로딩은 백그라운드에서 처리 (즉시 UI 표시)
    if (isAuthenticated) {
      loadPerformances();
    }
  }, [isAuthenticated, authLoading, loadPerformances, router]);

  const handleDelete = useCallback(async (id: number, title: string) => {
    if (!confirm(`정말로 "${title}" 공연을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deletePerformance(id);
      alert('공연이 삭제되었습니다.');
      loadPerformances();
      if (selectedPerformance?.id === id) {
        setSelectedPerformance(null);
      }
    } catch (error: any) {
      alert(error.message || '삭제에 실패했습니다.');
    }
  }, [loadPerformances, selectedPerformance]);

  const handlePerformanceSelect = useCallback(async (performance: any) => {
    // 목록의 performance는 sessions 정보가 없으므로, 상세 정보를 별도로 로드
    if (!performance.sessions) {
      try {
        const detail = await getPerformanceById(performance.id);
        setSelectedPerformance(detail);
      } catch (error) {
        console.error('Failed to load performance detail:', error);
        setSelectedPerformance(performance);
      }
    } else {
      setSelectedPerformance(performance);
    }
  }, []);

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
              공연정보
            </h1>
            <p className={styles.headerSubtitle}>
              공연 정보 및 세션 관리
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
              href="/admin/performances/create"
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
              + 공연 등록
            </Link>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedPerformance ? '1fr 400px' : '1fr',
          gap: '20px',
        }} className="members-layout">
          {/* 공연 목록 */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}>
            {performances.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                등록된 공연이 없습니다.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '12px',
                maxHeight: '70vh',
                overflowY: 'auto',
              }}>
                {performances.map((performance) => (
                  <div
                    key={performance.id}
                    onClick={() => handlePerformanceSelect(performance)}
                    style={{
                      padding: '20px',
                      border: selectedPerformance?.id === performance.id ? '2px solid #667eea' : '1px solid #e0e0e0',
                      borderRadius: '8px',
                      background: selectedPerformance?.id === performance.id ? '#f0f4ff' : '#f9f9f9',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '8px',
                    }}>
                      {performance.title}
                    </div>
                    <div style={{
                      color: '#666',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                    }}>
                      {new Date(performance.startDate).toLocaleDateString('ko-KR')} ~ {new Date(performance.endDate).toLocaleDateString('ko-KR')}
                    </div>
                    {performance._count && (
                      <div style={{
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap',
                        marginTop: '10px',
                      }}>
                        <span style={{
                          padding: '4px 12px',
                          background: '#667eea',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                        }}>
                          세션 {performance._count?.sessions || 0}개
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 공연 상세 정보 */}
          {selectedPerformance && (
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
                  {selectedPerformance.title}
                </h2>
                <button
                  onClick={() => setSelectedPerformance(null)}
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
                marginBottom: '25px',
              }}>
                <DetailRow label="공연 기간" value={`${new Date(selectedPerformance.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(selectedPerformance.endDate).toLocaleDateString('ko-KR')}`} />
                <DetailRow label="세션 수" value={`${selectedPerformance.sessions?.length || 0}개`} />
              </div>

              {selectedPerformance.sessions && selectedPerformance.sessions.length > 0 && (
                <div style={{ marginBottom: '25px' }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '15px',
                  }}>
                    공연 세션
                  </h3>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {selectedPerformance.sessions.map((session: any) => (
                      <div
                        key={session.id}
                        style={{
                          padding: '12px',
                          background: '#f9f9f9',
                          borderRadius: '8px',
                          border: '1px solid #e0e0e0',
                        }}
                      >
                        <div style={{
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          color: '#333',
                          marginBottom: '5px',
                        }}>
                          {new Date(session.sessionDatetime).toLocaleString('ko-KR')}
                        </div>
                        {session.note && (
                          <div style={{
                            fontSize: '0.85rem',
                            color: '#666',
                            marginTop: '5px',
                          }}>
                            {session.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '25px',
                paddingTop: '25px',
                borderTop: '1px solid #e0e0e0',
              }}>
                <Link
                  href={`/admin/performances/${selectedPerformance.id}/edit`}
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
                  onClick={() => handleDelete(selectedPerformance.id, selectedPerformance.title)}
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


