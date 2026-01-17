'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import { getAdminMe, getAllAdmins, deleteAdmin, getAllMemberLevels, createMemberLevel, updateMemberLevel, deleteMemberLevel } from '@/lib/adminApi';
import styles from '../admin.module.css';

export default function AdminsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('admins');
  const [admins, setAdmins] = useState<any[]>([]);
  const [memberLevels, setMemberLevels] = useState<any[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [showLevelForm, setShowLevelForm] = useState(false);
  const [levelFormData, setLevelFormData] = useState({ name: '', description: '' });
  
  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'confirm' | 'error'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'admin' | 'level'; id: number; name: string; loginId?: string } | null>(null);

  useEffect(() => {
    checkAuth();
    loadAdmins();
    loadMemberLevels();
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
      setProcessing(true);
      const data = await getAllAdmins();
      setAdmins(data);
    } catch (error) {
      console.error('Failed to load admins:', error);
      showModal('error', '오류', '관리자 목록을 불러오는데 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const loadMemberLevels = async () => {
    try {
      setProcessing(true);
      const data = await getAllMemberLevels();
      setMemberLevels(data);
    } catch (error) {
      console.error('Failed to load member levels:', error);
      showModal('error', '오류', '단원 레벨 목록을 불러오는데 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const showModal = (type: 'info' | 'confirm' | 'error', title: string, message: string, onConfirm?: () => void) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalOnConfirm(onConfirm || null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalOnConfirm(null);
    setDeleteTarget(null);
  };

  const handleModalConfirm = () => {
    if (modalOnConfirm) {
      modalOnConfirm();
    }
    closeModal();
  };

  const handleDeleteClick = (id: number, name: string, loginId: string) => {
    // admin 계정은 시스템 관리자만 삭제 가능
    if (loginId === 'admin' && currentAdmin?.adminType !== 'SYSTEM') {
      showModal('error', '권한 없음', '시스템 관리자만 admin 계정을 삭제할 수 있습니다.');
      return;
    }

    setDeleteTarget({ type: 'admin', id, name, loginId });
    showModal('confirm', '삭제 확인', `정말로 "${name}" 관리자를 삭제하시겠습니까?`, () => handleDelete(id, name));
  };

  const handleDelete = async (id: number, name: string) => {
    try {
      setProcessing(true);
      await deleteAdmin(id);
      showModal('info', '완료', '관리자가 삭제되었습니다.', () => loadAdmins());
    } catch (error: any) {
      showModal('error', '오류', error.message || '삭제에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleLevelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProcessing(true);
      if (editingLevel) {
        await updateMemberLevel(editingLevel.id, levelFormData);
        showModal('info', '완료', '단원 레벨이 수정되었습니다.', () => {
          setShowLevelForm(false);
          setEditingLevel(null);
          setLevelFormData({ name: '', description: '' });
          loadMemberLevels();
        });
      } else {
        await createMemberLevel(levelFormData);
        showModal('info', '완료', '단원 레벨이 등록되었습니다.', () => {
          setShowLevelForm(false);
          setEditingLevel(null);
          setLevelFormData({ name: '', description: '' });
          loadMemberLevels();
        });
      }
    } catch (error: any) {
      showModal('error', '오류', error.message || '등록/수정에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleLevelEdit = (level: any) => {
    setEditingLevel(level);
    setLevelFormData({ name: level.name, description: level.description || '' });
    setShowLevelForm(true);
  };

  const handleLevelDeleteClick = (id: number, name: string) => {
    setDeleteTarget({ type: 'level', id, name });
    showModal('confirm', '삭제 확인', `정말로 "${name}" 단원 레벨을 삭제하시겠습니까?\n\n주의: 해당 레벨을 사용하는 멤버가 있으면 삭제할 수 없습니다.`, () => handleLevelDelete(id, name));
  };

  const handleLevelDelete = async (id: number, name: string) => {
    try {
      setProcessing(true);
      await deleteMemberLevel(id);
      showModal('info', '완료', '단원 레벨이 삭제되었습니다.', () => loadMemberLevels());
    } catch (error: any) {
      showModal('error', '오류', error.message || '삭제에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleLevelCancel = () => {
    setShowLevelForm(false);
    setEditingLevel(null);
    setLevelFormData({ name: '', description: '' });
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
      {/* 프로그레스 바 */}
      {processing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{
            width: '100%',
            height: '4px',
            overflow: 'hidden',
            background: '#f0f0f0',
            position: 'relative',
          }}>
            <div className={styles.progressIndicator} />
          </div>
        </div>
      )}

      <div className={styles.content}>
        {/* 헤더 */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>
              관리자 설정
            </h1>
            <p className={styles.headerSubtitle}>
              관리자 계정 및 단원 레벨 관리
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
            {activeTab === 'admins' && (
              <Link
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
              </Link>
            )}
            {activeTab === 'member-levels' && !showLevelForm && (
              <button
                onClick={() => {
                  setEditingLevel(null);
                  setLevelFormData({ name: '', description: '' });
                  setShowLevelForm(true);
                }}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                + 단원 레벨 등록
              </button>
            )}
          </div>
        </div>

        {/* 탭 컨테이너 */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} style={{ width: '100%' }}>
          <Tabs.List style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '24px',
            borderBottom: '2px solid #e0e0e0',
          }}>
            <Tabs.Trigger
              value="admins"
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'admins' ? '3px solid #667eea' : '3px solid transparent',
                color: activeTab === 'admins' ? '#667eea' : '#666',
                fontWeight: activeTab === 'admins' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.2s',
              }}
            >
              관리자 계정 관리
            </Tabs.Trigger>
            <Tabs.Trigger
              value="member-levels"
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'member-levels' ? '3px solid #667eea' : '3px solid transparent',
                color: activeTab === 'member-levels' ? '#667eea' : '#666',
                fontWeight: activeTab === 'member-levels' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.2s',
              }}
            >
              단원 레벨 관리
            </Tabs.Trigger>
          </Tabs.List>

          {/* 관리자 계정 관리 탭 */}
          <Tabs.Content value="admins">
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
                            <Link
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
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(admin.id, admin.name, admin.loginId)}
                              disabled={admin.loginId === 'admin' && currentAdmin?.adminType !== 'SYSTEM' || processing}
                              style={{
                                padding: '8px 16px',
                                background: admin.loginId === 'admin' && currentAdmin?.adminType !== 'SYSTEM' ? '#ccc' : '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: admin.loginId === 'admin' && currentAdmin?.adminType !== 'SYSTEM' || processing ? 'not-allowed' : 'pointer',
                                fontSize: '0.9rem',
                                opacity: admin.loginId === 'admin' && currentAdmin?.adminType !== 'SYSTEM' || processing ? 0.6 : 1,
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
          </Tabs.Content>

          {/* 단원 레벨 관리 탭 */}
          <Tabs.Content value="member-levels">
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}>
              {showLevelForm ? (
                <form onSubmit={handleLevelSubmit} style={{
                  padding: '20px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  background: '#f9f9f9',
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem', fontWeight: '600' }}>
                    {editingLevel ? '단원 레벨 수정' : '단원 레벨 등록'}
                  </h3>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                      레벨 이름 <span style={{ color: '#dc3545' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={levelFormData.name}
                      onChange={(e) => setLevelFormData({ ...levelFormData, name: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                      설명
                    </label>
                    <textarea
                      value={levelFormData.description}
                      onChange={(e) => setLevelFormData({ ...levelFormData, description: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleLevelCancel}
                      style={{
                        padding: '10px 20px',
                        background: '#f5f5f5',
                        color: '#333',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '10px 20px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                      }}
                    >
                      {editingLevel ? '수정' : '등록'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {memberLevels.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      등록된 단원 레벨이 없습니다.
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gap: '15px',
                    }}>
                      {memberLevels.map((level) => (
                        <div
                          key={level.id}
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
                              {level.name}
                            </div>
                            {level.description && (
                              <div style={{
                                color: '#666',
                                fontSize: '0.9rem',
                              }}>
                                {level.description}
                              </div>
                            )}
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: '10px',
                            flexWrap: 'wrap',
                          }}>
                            <button
                              onClick={() => handleLevelEdit(level)}
                              style={{
                                padding: '8px 16px',
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                              }}
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleLevelDeleteClick(level.id, level.name)}
                              disabled={processing}
                              style={{
                                padding: '8px 16px',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: processing ? 'not-allowed' : 'pointer',
                                fontSize: '0.9rem',
                                opacity: processing ? 0.6 : 1,
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* 모달 */}
      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
          }} />
          <Dialog.Content
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              minWidth: '400px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              zIndex: 10001,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
            onEscapeKeyDown={closeModal}
            onPointerDownOutside={modalType === 'info' ? closeModal : undefined}
          >
            <Dialog.Title style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '12px',
              color: modalType === 'error' ? '#dc3545' : modalType === 'confirm' ? '#667eea' : '#333',
            }}>
              {modalTitle}
            </Dialog.Title>
            <Dialog.Description style={{
              marginBottom: '20px',
              color: '#666',
              whiteSpace: 'pre-line',
              lineHeight: '1.6',
            }}>
              {modalMessage}
            </Dialog.Description>
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
            }}>
              {modalType === 'confirm' && (
                <button
                  onClick={closeModal}
                  style={{
                    padding: '10px 20px',
                    background: '#f5f5f5',
                    color: '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  취소
                </button>
              )}
              <button
                onClick={handleModalConfirm}
                style={{
                  padding: '10px 20px',
                  background: modalType === 'error' ? '#dc3545' : modalType === 'confirm' ? '#667eea' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                }}
              >
                {modalType === 'confirm' ? '확인' : '닫기'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
