'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllMembers, getRegularMeetingSchedules, getSameDayRentalRequests } from '@/lib/adminApi';
import { useAdmin } from '@/contexts/AdminContext';
import styles from '../admin.module.css';

export default function AdminDashboard() {
  const router = useRouter();
  const { currentAdmin: admin, isAuthenticated, loading: authLoading } = useAdmin();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalMeetings: 0,
    pendingRequests: 0,
  });

  useEffect(() => {
    // 인증 확인 (Context에서 처리됨)
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    // 데이터 로딩은 백그라운드에서 처리 (즉시 UI 표시)
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated, authLoading]);

  const loadStats = async () => {
    try {
      const [members, meetings, requests] = await Promise.all([
        getAllMembers(),
        getRegularMeetingSchedules(),
        getSameDayRentalRequests({ status: 'pending' }),
      ]);

      setStats({
        totalMembers: members.length,
        totalMeetings: meetings.length,
        pendingRequests: requests.length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
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
              관리자 대시보드
            </h1>
            <p className={styles.headerSubtitle}>
              {admin?.name}님 환영합니다
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link
              href="/"
              style={{
                padding: '10px 20px',
                background: '#f5f5f5',
                color: '#333',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              메인으로
            </Link>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className={styles.statsGrid}>
          <StatCard title="전체 단원" value={stats.totalMembers} icon="👥" />
          <StatCard title="정기모임" value={stats.totalMeetings} icon="📅" />
          <StatCard title="대기 중인 신청" value={stats.pendingRequests} icon="⏳" />
        </div>

        {/* 메뉴 카드 */}
        <div className={styles.menuGrid}>
          <MenuCard
            title="관리자 설정"
            description="관리자 목록 및 계정 관리"
            href="/admin/admins"
            icon="👨‍💼"
          />
          <MenuCard
            title="단원 정보"
            description="단원 정보 조회 및 관리"
            href="/admin/members"
            icon="👤"
          />
          <MenuCard
            title="회비 관리"
            description="회비 설정 및 납부 내역 관리"
            href="/admin/membership-fees"
            icon="💰"
          />
          <MenuCard
            title="연습실 대관"
            description="대관 스케줄 및 납부 내역 관리"
            href="/admin/rentals"
            icon="🏢"
          />
          <MenuCard
            title="공연정보"
            description="공연 정보 및 세션 관리"
            href="/admin/performances"
            icon="🎭"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statValue}>
        {value}
      </div>
      <div className={styles.statTitle}>{title}</div>
    </div>
  );
}

function MenuCard({ title, description, href, icon }: { title: string; description: string; href: string; icon: string }) {
  return (
    <Link href={href} className={styles.menuCard}>
      <div className={styles.menuIcon}>{icon}</div>
      <h3 className={styles.menuTitle}>
        {title}
      </h3>
      <p className={styles.menuDescription}>
        {description}
      </p>
    </Link>
  );
}

