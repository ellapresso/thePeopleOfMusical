'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminMe, getAllAdmins, deleteAdmin } from '@/lib/adminApi';
import styles from '../admin.module.css';

export default function AdminsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<any[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    loadAdmins();
  }, []);

  const checkAuth = async () => {
    try {
      const adminData = await getAdminMe();
      setCurrentAdmin(adminData);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const loadAdmins = async () => {
    try {
      const data = await getAllAdmins();
      setAdmins(data);
    } catch (error) {
      console.error('Failed to load admins:', error);
    }
  };

  const handleDelete = async (id: number, name: string, loginId: string) => {
    // admin 계정은 시스템 관리자만 삭제 가능
    if (loginId === 'admin' && currentAdmin?.adminType !== 'SYSTEM') {
      alert('시스템 관리자만 admin 계정을 삭제할 수 있습니다.');
      return;
    }

    if (!confirm(`정말로 "${name}" 관리자를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteAdmin(id);
      alert('관리자가 삭제되었습니다.');
      loadAdmins();
    } catch (error: any) {
      alert(error.message || '삭제에 실패했습니다.');
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
              관리자 설정
            </h1>
            <p className={styles.headerSubtitle}>
              관리자 계정 관리
            </p>
          </div>
          <div className={styles.headerActions}>
            <a
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
            </a>
            <a
              href="/admin/admins/create"
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
              + 관리자 등록
            </a>
          </div>
        </div>

        {/* 관리자 목록 */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}>
          {admins.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              등록된 관리자가 없습니다.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '15px',
            }}>
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  style={{
                    padding: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    background: '#f9f9f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '15px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '5px',
                    }}>
                      {admin.name}
                    </div>
                    <div style={{
                      color: '#666',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                    }}>
                      아이디: {admin.loginId}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{
                        padding: '4px 12px',
                        background: admin.adminType === 'SYSTEM' ? '#dc3545' : '#667eea',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                      }}>
                        {admin.adminType === 'SYSTEM' ? '시스템 관리자' : '일반 관리자'}
                      </span>
                      {admin.member && (
                        <span style={{
                          padding: '4px 12px',
                          background: '#28a745',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                        }}>
                          단원 연결됨
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}>
                    {/* admin 계정은 시스템 관리자만 수정/삭제 가능 */}
                    {admin.loginId === 'admin' && currentAdmin?.adminType !== 'SYSTEM' ? (
                      <div style={{
                        padding: '8px 16px',
                        background: '#f5f5f5',
                        color: '#999',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        border: '1px solid #e0e0e0',
                      }}>
                        수정 불가
                      </div>
                    ) : (
                      <>
                        <a
                          href={`/admin/admins/${admin.id}/edit`}
                          style={{
                            padding: '8px 16px',
                            background: '#667eea',
                            color: 'white',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                          }}
                        >
                          수정
                        </a>
                        <button
                          onClick={() => handleDelete(admin.id, admin.name, admin.loginId)}
                          disabled={admin.loginId === 'admin' && currentAdmin?.adminType !== 'SYSTEM'}
                          style={{
                            padding: '8px 16px',
                            background: admin.loginId === 'admin' && currentAdmin?.adminType !== 'SYSTEM' ? '#ccc' : '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: admin.loginId === 'admin' && currentAdmin?.adminType !== 'SYSTEM' ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            opacity: admin.loginId === 'admin' && currentAdmin?.adminType !== 'SYSTEM' ? 0.6 : 1,
                          }}
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
