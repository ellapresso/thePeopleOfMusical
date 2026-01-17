'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminMe, getMembershipFeePayments, getMembershipFeePolicies } from '@/lib/adminApi';
import styles from '../admin.module.css';

export default function MembershipFeesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'policies' | 'payments'>('policies');
  const [policies, setPolicies] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    loadData();
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

  const loadData = async () => {
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
        {activeTab === 'policies' ? (
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
                    }}
                  >
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
                ))}
              </div>
            )}
          </div>
        ) : (
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
              <Link
                href="/admin/membership-fees/payments/create"
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
                + 납부 등록
              </Link>
            </div>
            {payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                등록된 납부 내역이 없습니다.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    style={{
                      padding: '20px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      background: '#f9f9f9',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '10px',
                    }}>
                      <div>
                        <div style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: '#333',
                          marginBottom: '5px',
                        }}>
                          {payment.member?.name || '단원 정보 없음'}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                          {payment.targetYear}년 {payment.targetMonth}월
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        background: payment.paymentStatus === 'PAID' ? '#28a745' : 
                                   payment.paymentStatus === 'PARTIAL' ? '#ffc107' : '#dc3545',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                      }}>
                        {payment.paymentStatus === 'PAID' ? '납부완료' : 
                         payment.paymentStatus === 'PARTIAL' ? '부분납부' : '미납'}
                      </span>
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                      원금: {parseInt(payment.originalAmount).toLocaleString()}원 / 
                      납부: {parseInt(payment.paidAmount).toLocaleString()}원
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


