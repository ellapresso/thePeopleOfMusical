'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { getMembershipFeePayments, getMembershipFeePolicies, deleteMembershipFeePolicy, getAllMembers, createMembershipFeePayment, updateMembershipFeePayment } from '@/lib/adminApi';
import { useAdmin } from '@/contexts/AdminContext';
import styles from '../admin.module.css';

export default function MembershipFeesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, isSystemAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState<'policies' | 'payment-processing' | 'payments'>('policies');
  const [policies, setPolicies] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  
  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'confirm' | 'error'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [policiesData, paymentsData] = await Promise.all([
        getMembershipFeePolicies(),
        getMembershipFeePayments(),
      ]);
      setPolicies(policiesData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Failed to load data:', error);
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
      loadData();
    }
  }, [isAuthenticated, authLoading, loadData, router]);

  const showModal = useCallback((type: 'info' | 'confirm' | 'error', title: string, message: string, onConfirm?: () => void) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalOnConfirm(onConfirm || null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalOnConfirm(null);
    setDeleteTarget(null);
  }, []);

  const handleModalConfirm = useCallback(() => {
    if (modalOnConfirm) {
      modalOnConfirm();
    }
    closeModal();
  }, [modalOnConfirm, closeModal]);

  const handleDelete = useCallback(async (id: number, name: string) => {
    try {
      setProcessing(true);
      await deleteMembershipFeePolicy(id);
      showModal('info', '완료', '회비 정책이 삭제되었습니다.', () => loadData());
    } catch (error: any) {
      showModal('error', '오류', error.message || '삭제에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  }, [loadData, showModal]);

  const handleDeleteClick = useCallback((id: number, name: string) => {
    setDeleteTarget({ id, name });
    showModal('confirm', '삭제 확인', `정말로 "${name}" 회비 정책을 삭제하시겠습니까?`, () => handleDelete(id, name));
  }, [showModal, handleDelete]);

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
              회비 관리
            </h1>
            <p className={styles.headerSubtitle}>
              회비 정책 및 납부 내역 관리
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
          </div>
        </div>

        {/* 탭 */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px 30px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          gap: '10px',
        }}>
          <button
            onClick={() => setActiveTab('policies')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'policies' ? '#667eea' : '#f5f5f5',
              color: activeTab === 'policies' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
            }}
          >
            회비 정책
          </button>
          <button
            onClick={() => setActiveTab('payment-processing')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'payment-processing' ? '#667eea' : '#f5f5f5',
              color: activeTab === 'payment-processing' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
            }}
          >
            납부 처리
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'payments' ? '#667eea' : '#f5f5f5',
              color: activeTab === 'payments' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
            }}
          >
            납부 내역
          </button>
        </div>

        {/* 컨텐츠 */}
        {activeTab === 'policies' && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#333' }}>회비 정책</h2>
              <Link
                href="/admin/membership-fees/policies/create"
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
                + 정책 추가
              </Link>
            </div>
            {policies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                등록된 회비 정책이 없습니다.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {policies.map((policy) => (
                  <div
                    key={policy.id}
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
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#333',
                        marginBottom: '10px',
                      }}>
                        {policy.memberLevel?.name || '레벨 정보 없음'}
                      </div>
                      <div style={{ color: '#666', marginBottom: '5px' }}>
                        기본 금액: {parseInt(policy.baseAmount).toLocaleString()}원
                      </div>
                      {policy.description && (
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                          {policy.description}
                        </div>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}>
                      <Link
                        href={`/admin/membership-fees/policies/${policy.id}/edit`}
                        style={{
                          padding: '8px 16px',
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(policy.id, policy.memberLevel?.name || '회비 정책')}
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
          </div>
        )}
        
        {activeTab === 'payment-processing' && (
          <PaymentProcessingTab 
            policies={policies}
            showModal={showModal}
            processing={processing}
            setProcessing={setProcessing}
            payments={payments}
            setPayments={setPayments}
          />
        )}
        
        {activeTab === 'payments' && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#333' }}>납부 내역</h2>
            </div>
            
            {/* 총 처리된 금액 (시스템 관리자만) */}
            {isSystemAdmin && payments.length > 0 && (() => {
              const totalAmount = payments.reduce((sum, payment) => {
                return sum + parseFloat(payment.paidAmount || 0);
              }, 0);
              return (
                <div style={{
                  padding: '15px 20px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid #e0e0e0',
                }}>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#333',
                  }}>
                    총 처리된 금액: <span style={{ color: '#667eea' }}>{totalAmount.toLocaleString()}원</span>
                  </div>
                </div>
              );
            })()}

            {payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                등록된 납부 내역이 없습니다.
              </div>
            ) : (
              <div style={{
                overflowX: 'auto',
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}>
                  <thead>
                    <tr style={{
                      borderBottom: '2px solid #e0e0e0',
                      background: '#f8f9fa',
                    }}>
                      <th style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#333',
                      }}>
                        단원명
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#333',
                      }}>
                        대상년월
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#333',
                      }}>
                        원금
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#333',
                      }}>
                        납부금액
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#333',
                      }}>
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} style={{
                        borderBottom: '1px solid #f0f0f0',
                      }}>
                        <td style={{
                          padding: '12px',
                          color: '#333',
                          fontWeight: '500',
                        }}>
                          {payment.member?.name || '단원 정보 없음'}
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'center',
                          color: '#666',
                        }}>
                          {payment.targetYear}년 {payment.targetMonth}월
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'right',
                          color: '#666',
                        }}>
                          {parseInt(payment.originalAmount).toLocaleString()}원
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'right',
                          color: '#333',
                          fontWeight: '500',
                        }}>
                          {parseInt(payment.paidAmount).toLocaleString()}원
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'center',
                        }}>
                          <span style={{
                            padding: '4px 12px',
                            background: payment.paymentStatus === 'PAID' ? '#28a745' : 
                                       payment.paymentStatus === 'PARTIAL' ? '#ffc107' : '#dc3545',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            display: 'inline-block',
                          }}>
                            {payment.paymentStatus === 'PAID' ? '납부완료' : 
                             payment.paymentStatus === 'PARTIAL' ? '부분납부' : '미납'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
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
          <Dialog.Content style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            minWidth: '400px',
            maxWidth: '90vw',
            zIndex: 10001,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          }}>
            <Dialog.Title style={{
              fontSize: '1.3rem',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#333',
            }}>
              {modalTitle}
            </Dialog.Title>
            <Dialog.Description style={{
              marginBottom: '20px',
              color: '#666',
              whiteSpace: 'pre-line',
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

function PaymentProcessingTab({ policies, showModal, processing, setProcessing, payments, setPayments }: {
  policies: any[];
  showModal: (type: 'info' | 'confirm' | 'error', title: string, message: string, onConfirm?: () => void) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  payments: any[];
  setPayments: (payments: any[]) => void;
}) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // 즉시 UI 표시를 위해 false로 시작
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [localProcessing, setLocalProcessing] = useState<string | null>(null); // 특정 체크박스만 로딩
  
  // 6개월 기간 계산 (현재 기준 이전 2개월 + 현재 + 앞으로 3개월)
  const getMonthList = () => {
    const months: { year: number; month: number; label: string }[] = [];
    const now = new Date();
    for (let i = -2; i <= 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: `${date.getMonth() + 1}월`
      });
    }
    return months;
  };

  const monthList = getMonthList();
  
  // 회원별 체크 상태 관리
  const [checkedPayments, setCheckedPayments] = useState<Record<string, boolean>>({});
  
  // 회비 0원 이상 정책 ID 목록
  const validPolicyLevelIds = policies
    .filter(p => parseFloat(p.baseAmount) >= 0)
    .map(p => p.memberLevelId);

  useEffect(() => {
    loadMembers();
  }, [policies]);

  // payments가 변경되면 체크 상태 업데이트
  useEffect(() => {
    const checked: Record<string, boolean> = {};
    payments.forEach((payment: any) => {
      if (payment.paymentStatus === 'PAID') {
        const key = `${payment.memberId}-${payment.targetYear}-${payment.targetMonth}`;
        checked[key] = true;
      }
    });
    setCheckedPayments(checked);
  }, [payments]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const allMembers = await getAllMembers();
      // 회비 0원 이상 레벨의 회원만 필터링
      const filteredMembers = allMembers.filter((m: any) =>
        validPolicyLevelIds.includes(m.memberLevelId)
      );
      setMembers(filteredMembers);
      
      // 기존 납부 내역은 이미 로드되어 있으므로 부모 컴포넌트에서 전달받은 데이터 사용
      // 체크 상태는 handleCheckboxChange에서 관리
    } catch (error) {
      console.error('Failed to load members:', error);
      showModal('error', '오류', '회원 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = async (memberId: number, year: number, month: number, checked: boolean) => {
    const key = `${memberId}-${year}-${month}`;
    
    // 즉시 UI 업데이트 (낙관적 업데이트)
    setCheckedPayments(prev => ({ ...prev, [key]: checked }));

    try {
      // 특정 체크박스만 로딩 표시
      setLocalProcessing(key);
      
      const member = members.find(m => m.id === memberId);
      const policy = policies.find(p => p.memberLevelId === member?.memberLevelId);
      if (!member || !policy) {
        throw new Error('회원 또는 정책 정보를 찾을 수 없습니다.');
      }

      const originalAmount = parseFloat(policy.baseAmount);
      const paymentData = {
        memberId,
        memberLevelId: member.memberLevelId,
        targetYear: year,
        targetMonth: month,
        originalAmount,
        paidAmount: checked ? originalAmount : 0,
        paymentStatus: checked ? 'PAID' : 'UNPAID',
      };

      // 기존 납부 내역을 payments에서 찾기 (API 호출 없이)
      const existingPayment = payments.find(
        (p: any) => p.memberId === memberId && p.targetYear === year && p.targetMonth === month
      );

      let updatedPayment: any;
      if (existingPayment) {
        // 수정
        updatedPayment = await updateMembershipFeePayment(existingPayment.id, paymentData);
        // 화면 데이터 업데이트 (API 재호출 없이)
        setPayments(payments.map((p: any) => 
          p.id === existingPayment.id ? { ...updatedPayment, member, memberLevel: member.memberLevel } : p
        ));
      } else {
        // 생성
        updatedPayment = await createMembershipFeePayment(paymentData);
        // 화면 데이터에 추가 (API 재호출 없이)
        setPayments([...payments, { ...updatedPayment, member, memberLevel: member.memberLevel }]);
      }

      // 완료 모달 표시
      showModal('info', '완료', '납부 처리되었습니다.');
    } catch (error: any) {
      console.error('Failed to update payment:', error);
      // 실패 시 체크 상태 되돌리기
      setCheckedPayments(prev => ({ ...prev, [key]: !checked }));
      showModal('error', '오류', error.message || '납부 상태 업데이트에 실패했습니다.');
    } finally {
      setLocalProcessing(null);
    }
  };

  const totalPages = Math.ceil(members.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = members.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', color: '#333' }}>납부 처리</h2>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          로딩 중...
        </div>
      ) : paginatedMembers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          회비 정책이 있는 회원이 없습니다.
        </div>
      ) : (
        <>
          <div style={{
            overflowX: 'auto',
            marginBottom: '20px',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#333',
                    minWidth: '120px',
                  }}>
                    이름
                  </th>
                  {monthList.map((m) => (
                    <th key={`${m.year}-${m.month}`} style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#333',
                      minWidth: '80px',
                    }}>
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((member) => (
                  <tr key={member.id} style={{
                    borderBottom: '1px solid #f0f0f0',
                  }}>
                    <td style={{
                      padding: '12px',
                      fontWeight: '500',
                      color: '#333',
                    }}>
                      {member.name}
                    </td>
                    {monthList.map((m) => {
                      const key = `${member.id}-${m.year}-${m.month}`;
                      const isChecked = checkedPayments[key] || false;
                      const isProcessing = localProcessing === key;
                      return (
                        <td key={`${member.id}-${m.year}-${m.month}`} style={{
                          padding: '12px',
                          textAlign: 'center',
                          position: 'relative',
                        }}>
                          {isProcessing && (
                            <div className={styles.spinner} />
                          )}
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleCheckboxChange(member.id, m.year, m.month, e.target.checked)}
                            disabled={isProcessing || processing}
                            style={{
                              width: '20px',
                              height: '20px',
                              cursor: isProcessing || processing ? 'not-allowed' : 'pointer',
                              opacity: isProcessing ? 0.5 : 1,
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              marginTop: '20px',
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || processing}
                style={{
                  padding: '8px 16px',
                  background: currentPage === 1 ? '#f5f5f5' : '#667eea',
                  color: currentPage === 1 ? '#999' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                이전
              </button>
              <span style={{
                padding: '8px 16px',
                color: '#333',
                fontSize: '0.9rem',
              }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || processing}
                style={{
                  padding: '8px 16px',
                  background: currentPage === totalPages ? '#f5f5f5' : '#667eea',
                  color: currentPage === totalPages ? '#999' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
