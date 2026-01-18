'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { getRegularMeetingSchedules, deleteRegularMeetingSchedule, getRegularMeetingAttendances, createRegularMeetingAttendance, updateRegularMeetingAttendance, deleteRegularMeetingAttendance, getAllMembers } from '@/lib/adminApi';
import { useAdmin } from '@/contexts/AdminContext';
import styles from '../admin.module.css';

export default function RegularMeetingsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAdmin();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  
  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'confirm' | 'error'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'schedule' | 'attendance'; id: number; name: string } | null>(null);

  useEffect(() => {
    // 인증 확인 (Context에서 처리됨)
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    // 데이터 로딩은 백그라운드에서 처리 (즉시 UI 표시)
    if (isAuthenticated) {
      loadSchedules();
    }
  }, [isAuthenticated, authLoading]);

  const loadSchedules = async () => {
    try {
      const data = await getRegularMeetingSchedules();
      setSchedules(data);
    } catch (error) {
      console.error('Failed to load schedules:', error);
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

  const handleDeleteClick = (id: number, name: string, type: 'schedule' | 'attendance') => {
    setDeleteTarget({ type, id, name });
    showModal('confirm', '삭제 확인', `정말로 "${name}"을(를) 삭제하시겠습니까?`, () => handleDelete(id, type));
  };

  const handleDelete = async (id: number, type: 'schedule' | 'attendance') => {
    try {
      setProcessing(true);
      if (type === 'schedule') {
        await deleteRegularMeetingSchedule(id);
        showModal('info', '완료', '정기 모임이 삭제되었습니다.', () => {
          loadSchedules();
        });
      } else {
        await deleteRegularMeetingAttendance(id);
        if (selectedSchedule) {
          await loadScheduleAttendances(selectedSchedule.id);
        }
        loadSchedules(); // 목록 새로고침
      }
    } catch (error: any) {
      showModal('error', '오류', error.message || '삭제에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleAttendanceClick = (schedule: any) => {
    setSelectedSchedule(schedule);
    loadScheduleAttendances(schedule.id);
    setShowAttendanceModal(true);
  };

  const loadScheduleAttendances = async (scheduleId: number) => {
    try {
      const attendances = await getRegularMeetingAttendances({ regularMeetingScheduleId: scheduleId });
      setSelectedSchedule((prev: any) => ({
        ...prev,
        attendances: attendances || [],
      }));
    } catch (error) {
      console.error('Failed to load attendances:', error);
    }
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
              정기 모임 관리
            </h1>
            <p className={styles.headerSubtitle}>
              정기 모임 일정 및 참석 관리
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
              href="/admin/regular-meetings/create"
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
              + 모임 등록
            </Link>
          </div>
        </div>

        {/* 목록 */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}>
          {schedules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              등록된 정기 모임이 없습니다.
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
                      모임명
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#333',
                    }}>
                      모임일
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#333',
                    }}>
                      시간
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#333',
                    }}>
                      담당자
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#333',
                    }}>
                      참석인원
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#333',
                    }}>
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => {
                    const attendeeCount = schedule._count?.attendances || 0;
                    return (
                      <tr key={schedule.id} style={{
                        borderBottom: '1px solid #f0f0f0',
                      }}>
                        <td style={{
                          padding: '12px',
                          color: '#333',
                          fontWeight: '500',
                        }}>
                          {schedule.meetingName}
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'center',
                          color: '#666',
                        }}>
                          {(() => {
                            const date = typeof schedule.meetingDate === 'string' 
                              ? schedule.meetingDate.split('T')[0] 
                              : new Date(schedule.meetingDate);
                            const dateStr = typeof date === 'string' 
                              ? date 
                              : date.toISOString().split('T')[0];
                            const [year, month, day] = dateStr.split('-');
                            return `${year}.${month}.${day}`;
                          })()}
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'center',
                          color: '#666',
                        }}>
                          {(() => {
                            const formatTime = (timeStr: string | Date) => {
                              if (typeof timeStr === 'string') {
                                const match = timeStr.match(/(\d{2}):(\d{2})/);
                                if (match) return `${match[1]}:${match[2]}`;
                                return timeStr.substring(0, 5);
                              }
                              const hours = timeStr.getHours().toString().padStart(2, '0');
                              const minutes = timeStr.getMinutes().toString().padStart(2, '0');
                              return `${hours}:${minutes}`;
                            };
                            const startTime = formatTime(schedule.startTime);
                            const endTime = formatTime(schedule.endTime);
                            return `${startTime} - ${endTime}`;
                          })()}
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'center',
                          color: '#666',
                        }}>
                          {schedule.manager?.name || '-'}
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'center',
                          color: '#666',
                        }}>
                          {attendeeCount}명
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'center',
                        }}>
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'center',
                          }}>
                            <button
                              onClick={() => handleAttendanceClick(schedule)}
                              style={{
                                padding: '6px 12px',
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                              }}
                            >
                              참석인원
                            </button>
                            <Link
                              href={`/admin/regular-meetings/${schedule.id}/edit`}
                              prefetch={true}
                              style={{
                                padding: '6px 12px',
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                fontSize: '0.85rem',
                                display: 'inline-block',
                              }}
                            >
                              수정
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(schedule.id, schedule.meetingName, 'schedule')}
                              disabled={processing}
                              style={{
                                padding: '6px 12px',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: processing ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                opacity: processing ? 0.6 : 1,
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 참석 인원 모달 */}
      {showAttendanceModal && selectedSchedule && (
        <AttendanceModal
          schedule={selectedSchedule}
          onClose={() => {
            setShowAttendanceModal(false);
            setSelectedSchedule(null);
            loadSchedules(); // 모달 닫을 때 목록 새로고침
          }}
          onUpdate={loadSchedules}
          processing={processing}
        />
      )}

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

function AttendanceModal({ schedule, onClose, onUpdate, processing }: {
  schedule: any;
  onClose: () => void;
  onUpdate: () => void;
  processing: boolean;
}) {
  const [attendances, setAttendances] = useState<any[]>(schedule.attendances || []);
  const [members, setMembers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
    loadAttendances();
  }, [schedule.id]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await getAllMembers();
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendances = async () => {
    try {
      const data = await getRegularMeetingAttendances({ regularMeetingScheduleId: schedule.id });
      setAttendances(data || []);
    } catch (error) {
      console.error('Failed to load attendances:', error);
    }
  };

  const isMemberChecked = (memberId: number) => {
    return attendances.some((attendance: any) => attendance.memberId === memberId);
  };

  const handleCheckboxChange = async (memberId: number, checked: boolean) => {
    const existingAttendance = attendances.find((attendance: any) => attendance.memberId === memberId);

    try {
      setSubmitting(prev => ({ ...prev, [memberId]: true }));

      if (checked) {
        // 체크박스 선택 시 참석 등록
        if (!existingAttendance) {
          await createRegularMeetingAttendance({
            regularMeetingScheduleId: schedule.id,
            memberId: memberId,
            attendanceStatus: 'attended',
            memo: null,
          });
        }
      } else {
        // 체크박스 해제 시 참석 삭제
        if (existingAttendance) {
          await deleteRegularMeetingAttendance(existingAttendance.id);
        }
      }

      await loadAttendances();
      onUpdate();
    } catch (error: any) {
      alert(error.message || (checked ? '참석 등록에 실패했습니다.' : '참석 삭제에 실패했습니다.'));
    } finally {
      setSubmitting(prev => {
        const next = { ...prev };
        delete next[memberId];
        return next;
      });
    }
  };

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
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
          minWidth: '600px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 10001,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        }}>
          <Dialog.Title style={{
            fontSize: '1.3rem',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#333',
          }}>
            참석 인원 관리 - {schedule.meetingName}
          </Dialog.Title>
          <Dialog.Description style={{
            marginBottom: '20px',
            color: '#666',
          }}>
            {(() => {
              const date = typeof schedule.meetingDate === 'string' 
                ? schedule.meetingDate.split('T')[0] 
                : new Date(schedule.meetingDate);
              const dateStr = typeof date === 'string' 
                ? date 
                : date.toISOString().split('T')[0];
              const [year, month, day] = dateStr.split('-');
              const formatTime = (timeStr: string | Date) => {
                if (typeof timeStr === 'string') {
                  const match = timeStr.match(/(\d{2}):(\d{2})/);
                  if (match) return `${match[1]}:${match[2]}`;
                  return timeStr.substring(0, 5);
                }
                const hours = timeStr.getHours().toString().padStart(2, '0');
                const minutes = timeStr.getMinutes().toString().padStart(2, '0');
                return `${hours}:${minutes}`;
              };
              return `${year}.${month}.${day} ${formatTime(schedule.startTime)}`;
            })()}
          </Dialog.Description>

          {loading ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#999',
            }}>
              로딩 중...
            </div>
          ) : (
            <div style={{
              maxHeight: '60vh',
              overflowY: 'auto',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '12px',
            }}>
              {members.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#999',
                }}>
                  등록된 회원이 없습니다.
                </div>
              ) : (
                members.map((member: any) => {
                  const checked = isMemberChecked(member.id);
                  const isSubmitting = submitting[member.id] || false;
                  
                  return (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.6 : 1,
                      }}
                      onClick={() => {
                        if (!isSubmitting && !processing) {
                          handleCheckboxChange(member.id, !checked);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (!isSubmitting && !processing) {
                            handleCheckboxChange(member.id, e.target.checked);
                          }
                        }}
                        disabled={isSubmitting || processing}
                        style={{
                          marginRight: '12px',
                          width: '18px',
                          height: '18px',
                          cursor: (isSubmitting || processing) ? 'not-allowed' : 'pointer',
                        }}
                      />
                      <span style={{
                        fontSize: '0.95rem',
                        color: '#333',
                        flex: 1,
                      }}>
                        {member.name}
                      </span>
                      {isSubmitting && (
                        <span style={{
                          fontSize: '0.85rem',
                          color: '#666',
                          marginLeft: '8px',
                        }}>
                          처리 중...
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '20px',
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#f5f5f5',
                color: '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              닫기
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

