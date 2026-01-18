'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRentalSchedules, getRentalPayments, createRentalSchedule, updateRentalSchedule, deleteRentalSchedule, getAllMembers } from '@/lib/adminApi';
import { useAdmin } from '@/contexts/AdminContext';
import styles from '../admin.module.css';

export default function RentalsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAdmin();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberSearch, setShowMemberSearch] = useState(false);

  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    renterType: 'MEMBER',
    renterId: '',
    renterName: '',
    purpose: '',
    note: '',
  });

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
  }, [isAuthenticated, authLoading]);

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


  const loadData = async () => {
    try {
      const [schedulesData, paymentsData, membersData] = await Promise.all([
        getRentalSchedules(),
        getRentalPayments(),
        getAllMembers(),
      ]);
      setSchedules(schedulesData);
      setPayments(paymentsData);
      setMembers(membersData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // 선택된 날짜의 스케줄 필터링
  const filteredSchedules = selectedDate
    ? schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.startDatetime).toISOString().split('T')[0];
        return scheduleDate === selectedDate;
      })
    : schedules;

  // 캘린더 날짜 계산
  const today = new Date();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.startDatetime).toISOString().split('T')[0];
      return scheduleDate === dateStr;
    });
  };

  const formatTimeRange = (schedule: any) => {
    const start = new Date(schedule.startDatetime);
    const end = new Date(schedule.endDatetime);
    const startHour = start.getHours();
    const endHour = end.getHours();
    return `${startHour}-${endHour} ${schedule.renterName}`;
  };

  const handleDateDoubleClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setFormData({
      startDate: dateStr,
      startTime: '09:00',
      endDate: dateStr,
      endTime: '12:00',
      renterType: 'MEMBER',
      renterId: '',
      renterName: '',
      purpose: '',
      note: '',
    });
    setSelectedMember(null);
    setMemberSearchQuery('');
    setEditingSchedule(null);
    setShowModal(true);
  };

  const handleScheduleClick = (schedule: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const start = new Date(schedule.startDatetime);
    const end = new Date(schedule.endDatetime);
    
    // 단원이 연결된 경우 선택된 단원 설정
    let selectedMemberData = null;
    if (schedule.renterType === 'MEMBER' && schedule.renterId) {
      selectedMemberData = members.find(m => m.id === schedule.renterId);
      if (selectedMemberData) {
        setSelectedMember(selectedMemberData);
        setMemberSearchQuery(selectedMemberData.name);
      }
    } else {
      setSelectedMember(null);
      setMemberSearchQuery('');
    }
    
    setFormData({
      startDate: start.toISOString().split('T')[0],
      startTime: start.toTimeString().slice(0, 5),
      endDate: end.toISOString().split('T')[0],
      endTime: end.toTimeString().slice(0, 5),
      renterType: schedule.renterType,
      renterId: schedule.renterId?.toString() || '',
      renterName: schedule.renterName,
      purpose: schedule.purpose || '',
      note: schedule.note || '',
    });
    setEditingSchedule(schedule);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startDatetime = new Date(`${formData.startDate}T${formData.startTime}`).toISOString();
      const endDatetime = new Date(`${formData.endDate}T${formData.endTime}`).toISOString();

      const payload: any = {
        startDatetime,
        endDatetime,
        renterType: formData.renterType,
        renterName: formData.renterName,
        purpose: formData.purpose || null,
        note: formData.note || null,
      };

      if (formData.renterType === 'MEMBER' && formData.renterId) {
        payload.renterId = parseInt(formData.renterId);
      }

      if (editingSchedule) {
        await updateRentalSchedule(editingSchedule.id, payload);
      } else {
        await createRentalSchedule(payload);
      }

      setShowModal(false);
      loadData();
    } catch (error: any) {
      alert(error.message || '저장에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!editingSchedule) return;
    if (!confirm('정말로 이 대관 일정을 삭제하시겠습니까?')) return;

    try {
      await deleteRentalSchedule(editingSchedule.id);
      setShowModal(false);
      loadData();
    } catch (error: any) {
      alert(error.message || '삭제에 실패했습니다.');
    }
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
      renterId: member.id.toString(),
      renterName: member.name,
    }));
    setMemberSearchQuery(member.name);
    setShowMemberSearch(false);
    setMemberSearchResults([]);
  };

  const handleMemberClear = () => {
    setSelectedMember(null);
    setFormData(prev => ({
      ...prev,
      renterId: '',
      renterName: '',
    }));
    setMemberSearchQuery('');
    setShowMemberSearch(false);
    setMemberSearchResults([]);
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentYear, currentMonth + delta, 1);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
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
              연습실 대관
            </h1>
            <p className={styles.headerSubtitle}>
              대관 스케줄 및 납부 내역 관리
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

        {/* 뷰 모드 전환 */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px 30px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          gap: '10px',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setViewMode('calendar')}
              style={{
                padding: '10px 20px',
                background: viewMode === 'calendar' ? '#667eea' : '#f5f5f5',
                color: viewMode === 'calendar' ? 'white' : '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              캘린더
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '10px 20px',
                background: viewMode === 'list' ? '#667eea' : '#f5f5f5',
                color: viewMode === 'list' ? 'white' : '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              목록
            </button>
          </div>
          {viewMode === 'calendar' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button
                onClick={() => changeMonth(-1)}
                style={{
                  padding: '8px 15px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                ←
              </button>
              <div style={{ color: '#333', fontSize: '1rem', fontWeight: '600', minWidth: '120px', textAlign: 'center' }}>
                {currentYear}년 {currentMonth + 1}월
              </div>
              <button
                onClick={() => changeMonth(1)}
                style={{
                  padding: '8px 15px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                →
              </button>
            </div>
          )}
        </div>

        {/* 캘린더 뷰 */}
        {viewMode === 'calendar' ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}>
            {/* 요일 헤더 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '10px',
              marginBottom: '10px',
            }}>
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div
                  key={day}
                  style={{
                    textAlign: 'center',
                    fontWeight: '600',
                    color: day === '일' ? '#dc3545' : day === '토' ? '#667eea' : '#333',
                    padding: '10px',
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 캘린더 그리드 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '10px',
            }}>
              {/* 빈 칸 (첫 주 시작일 전) */}
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} style={{ minHeight: '100px' }} />
              ))}

              {/* 날짜 칸 */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const date = new Date(currentYear, currentMonth, i + 1);
                const dateStr = date.toISOString().split('T')[0];
                const daySchedules = getSchedulesForDate(date);
                const isToday = dateStr === today.toISOString().split('T')[0];
                const isSelected = dateStr === selectedDate;

                return (
                  <div
                    key={i}
                    onDoubleClick={() => handleDateDoubleClick(date)}
                    onClick={() => setSelectedDate(dateStr)}
                    style={{
                      minHeight: '100px',
                      padding: '8px',
                      border: isSelected ? '2px solid #667eea' : isToday ? '2px solid #28a745' : '1px solid #e0e0e0',
                      borderRadius: '8px',
                      background: isSelected ? '#f0f4ff' : isToday ? '#f0fff4' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !isToday) {
                        e.currentTarget.style.background = '#f9f9f9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !isToday) {
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: isToday ? 'bold' : 'normal',
                      color: isToday ? '#28a745' : '#333',
                      marginBottom: '5px',
                    }}>
                      {i + 1}
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                    }}>
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          onClick={(e) => handleScheduleClick(schedule, e)}
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 4px',
                            background: schedule.renterType === 'MEMBER' ? '#667eea' : '#28a745',
                            color: 'white',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={formatTimeRange(schedule)}
                        >
                          {formatTimeRange(schedule)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 목록 뷰 */
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}>
            {schedules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                등록된 대관 스케줄이 없습니다.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {schedules.map(schedule => {
                  const schedulePayments = payments.filter(p => p.rentalScheduleId === schedule.id);
                  const totalPaid = schedulePayments.reduce((sum, p) => sum + parseFloat(p.paidAmount), 0);
                  const totalOriginal = schedulePayments.reduce((sum, p) => sum + parseFloat(p.originalAmount), 0);

                  return (
                    <div
                      key={schedule.id}
                      onClick={() => handleScheduleClick(schedule, { stopPropagation: () => {} } as any)}
                      style={{
                        padding: '20px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        background: '#f9f9f9',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '10px',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}>
                        <div>
                          <div style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '5px',
                          }}>
                            {schedule.renterName}
                          </div>
                          <div style={{ color: '#666', fontSize: '0.9rem' }}>
                            {new Date(schedule.startDatetime).toLocaleString('ko-KR')} - 
                            {new Date(schedule.endDatetime).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          background: schedule.renterType === 'MEMBER' ? '#667eea' : '#28a745',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                        }}>
                          {schedule.renterType === 'MEMBER' ? '단원' : '외부'}
                        </span>
                      </div>
                      {schedulePayments.length > 0 && (
                        <div style={{
                          marginTop: '10px',
                          paddingTop: '10px',
                          borderTop: '1px solid #e0e0e0',
                          color: '#666',
                          fontSize: '0.9rem',
                        }}>
                          납부 내역: {totalPaid.toLocaleString()}원 / {totalOriginal.toLocaleString()}원
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 모달 */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowModal(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '30px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', color: '#333' }}>
                {editingSchedule ? '대관 일정 수정' : '대관 일정 등록'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                    시작 날짜 <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                    시작 시간 <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                    종료 날짜 <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                    종료 시간 <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                    대관자 타입 <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <select
                    value={formData.renterType}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, renterType: e.target.value, renterId: '', renterName: '' }));
                      setSelectedMember(null);
                      setMemberSearchQuery('');
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="MEMBER">단원</option>
                    <option value="EXTERNAL">외부</option>
                  </select>
                </div>

                {formData.renterType === 'MEMBER' && (
                  <div style={{ marginBottom: '20px', position: 'relative' }} className="member-search-container">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                      단원 선택
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
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          boxSizing: 'border-box',
                        }}
                        placeholder="단원 이름을 검색하세요 (최소 2자 이상)"
                      />
                      <button
                        type="button"
                        onClick={handleMemberSearch}
                        disabled={memberSearchQuery.trim().length < 2}
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
                      단원 이름을 검색하여 선택하세요
                    </small>
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                    대관자 이름 <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.renterName}
                    onChange={(e) => setFormData(prev => ({ ...prev, renterName: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                    목적
                  </label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                    비고
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {editingSchedule ? '수정' : '등록'}
                  </button>
                  {editingSchedule && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      style={{
                        padding: '12px 20px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      삭제
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: '12px 20px',
                      background: '#f5f5f5',
                      color: '#333',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
