'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getAdminMe, getPerformanceById, updatePerformance, getAllMembers, getAllRoles } from '@/lib/adminApi';
import styles from '../../../admin.module.css';
import formStyles from '../../create/create.module.css';

export default function EditPerformancePage() {
  const router = useRouter();
  const params = useParams();
  const performanceId = parseInt(params.id as string);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
  });
  const [sessions, setSessions] = useState<Array<{ 
    id?: number; 
    sessionDate: string; 
    sessionTime: string; 
    note: string;
    members: Array<{ memberId: string; roleId: string; characterName: string }>;
  }>>([]);

  const [members, setMembers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  // 각 배우 입력별 검색 상태 관리: "sessionIndex-memberIndex" 형식의 키
  const [memberSearchStates, setMemberSearchStates] = useState<Record<string, {
    query: string;
    results: any[];
    showResults: boolean;
  }>>({});

  useEffect(() => {
    const initialize = async () => {
      const authSuccess = await checkAuth();
      if (authSuccess) {
        await loadMembersAndRoles();
        await loadPerformance();
      }
      setLoading(false);
    };
    initialize();
  }, [performanceId]);

  // sessions와 members가 모두 로드된 후 검색 상태 초기화
  useEffect(() => {
    if (sessions.length > 0 && members.length > 0) {
      const initialMemberSearchStates: Record<string, { query: string; results: any[]; showResults: boolean }> = {};
      sessions.forEach((session, sessionIndex) => {
        session.members.forEach((member: any, memberIndex: number) => {
          if (member.memberId) {
            const key = `${sessionIndex}-${memberIndex}`;
            const memberData = members.find(m => m.id.toString() === member.memberId);
            if (memberData) {
              initialMemberSearchStates[key] = {
                query: memberData.name,
                results: [],
                showResults: false,
              };
            }
          }
        });
      });
      setMemberSearchStates(prev => ({ ...prev, ...initialMemberSearchStates }));
    }
  }, [sessions, members]);

  const checkAuth = async () => {
    try {
      await getAdminMe();
      return true;
    } catch (error) {
      router.push('/admin/login');
      return false;
    }
  };

  const loadMembersAndRoles = async () => {
    try {
      const [membersData, rolesData] = await Promise.all([
        getAllMembers(),
        getAllRoles(),
      ]);
      setMembers(membersData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Failed to load members or roles:', error);
    }
  };

  const loadPerformance = async () => {
    try {
      const data = await getPerformanceById(performanceId);
      
      // 날짜를 YYYY-MM-DD 형식으로 변환
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      setFormData({
        title: data.title,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      // 회차 정보 변환
      if (data.sessions && data.sessions.length > 0) {
        const formattedSessions = data.sessions.map((session: any) => {
          const sessionDate = new Date(session.sessionDatetime);
          return {
            id: session.id,
            sessionDate: sessionDate.toISOString().split('T')[0],
            sessionTime: sessionDate.toTimeString().slice(0, 5), // HH:MM 형식
            note: session.note || '',
            members: (session.performanceMembers || []).map((pm: any) => ({
              memberId: pm.memberId.toString(),
              roleId: pm.roleId.toString(),
              characterName: pm.characterName || '',
            })),
          };
        });
        setSessions(formattedSessions);
      } else {
        setSessions([{ sessionDate: '', sessionTime: '', note: '', members: [] }]);
      }
    } catch (error: any) {
      setError(error.message || '공연 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSessionChange = (index: number, field: 'sessionDate' | 'sessionTime' | 'note', value: string) => {
    const newSessions = [...sessions];
    newSessions[index] = { ...newSessions[index], [field]: value };
    setSessions(newSessions);
  };

  const addSession = () => {
    setSessions([...sessions, { sessionDate: '', sessionTime: '', note: '', members: [] }]);
  };

  const addMemberToSession = (sessionIndex: number) => {
    const newSessions = [...sessions];
    newSessions[sessionIndex].members.push({ memberId: '', roleId: '', characterName: '' });
    setSessions(newSessions);
  };

  const removeMemberFromSession = (sessionIndex: number, memberIndex: number) => {
    const newSessions = [...sessions];
    newSessions[sessionIndex].members = newSessions[sessionIndex].members.filter((_, i) => i !== memberIndex);
    setSessions(newSessions);
  };

  const handleMemberChange = (sessionIndex: number, memberIndex: number, field: 'memberId' | 'roleId' | 'characterName', value: string) => {
    const newSessions = [...sessions];
    newSessions[sessionIndex].members[memberIndex] = {
      ...newSessions[sessionIndex].members[memberIndex],
      [field]: value,
    };
    setSessions(newSessions);

    // memberId가 변경되면 검색 상태 초기화
    if (field === 'memberId' && value) {
      const key = `${sessionIndex}-${memberIndex}`;
      const selectedMember = members.find(m => m.id.toString() === value);
      setMemberSearchStates(prev => ({
        ...prev,
        [key]: {
          query: selectedMember?.name || '',
          results: [],
          showResults: false,
        },
      }));
    }

  };

  const getSearchKey = (sessionIndex: number, memberIndex: number) => {
    return `${sessionIndex}-${memberIndex}`;
  };

  const handleMemberSearchInputChange = (sessionIndex: number, memberIndex: number, value: string) => {
    const key = getSearchKey(sessionIndex, memberIndex);
    setMemberSearchStates(prev => ({
      ...prev,
      [key]: {
        query: value,
        results: prev[key]?.results || [],
        showResults: value.length >= 2 && (prev[key]?.results?.length || 0) > 0,
      },
    }));

    // 검색어가 2자 미만이면 결과 숨기기
    if (value.length < 2) {
      setMemberSearchStates(prev => ({
        ...prev,
        [key]: {
          query: value,
          results: [],
          showResults: false,
        },
      }));
    }
  };

  const handleMemberSearch = (sessionIndex: number, memberIndex: number) => {
    const key = getSearchKey(sessionIndex, memberIndex);
    const searchState = memberSearchStates[key];
    if (!searchState || searchState.query.trim().length < 2) {
      return;
    }

    const query = searchState.query.trim().toLowerCase();
    const filtered = members.filter((member: any) =>
      member.name.toLowerCase().includes(query)
    );

    setMemberSearchStates(prev => ({
      ...prev,
      [key]: {
        query: prev[key]?.query || '',
        results: filtered,
        showResults: filtered.length > 0,
      },
    }));
  };

  const handleMemberSelect = (sessionIndex: number, memberIndex: number, member: any) => {
    const key = getSearchKey(sessionIndex, memberIndex);
    handleMemberChange(sessionIndex, memberIndex, 'memberId', member.id.toString());
    setMemberSearchStates(prev => ({
      ...prev,
      [key]: {
        query: member.name,
        results: [],
        showResults: false,
      },
    }));
  };

  const handleMemberSearchClear = (sessionIndex: number, memberIndex: number) => {
    const key = getSearchKey(sessionIndex, memberIndex);
    handleMemberChange(sessionIndex, memberIndex, 'memberId', '');
    setMemberSearchStates(prev => ({
      ...prev,
      [key]: {
        query: '',
        results: [],
        showResults: false,
      },
    }));
  };


  const removeSession = (index: number) => {
    if (sessions.length > 1) {
      setSessions(sessions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.startDate || !formData.endDate) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    // 종료일이 시작일보다 이전이면 에러
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('종료일은 시작일보다 이후여야 합니다.');
      return;
    }

    // 회차 데이터 검증 및 변환
    const validSessions = sessions
      .filter(session => session.sessionDate && session.sessionTime)
      .map(session => {
        const sessionDatetime = new Date(`${session.sessionDate}T${session.sessionTime}`);
        return {
          sessionDatetime: sessionDatetime.toISOString(),
          note: session.note || null,
          members: session.members.filter(m => m.memberId && m.roleId).map(m => ({
            memberId: parseInt(m.memberId),
            roleId: parseInt(m.roleId),
            characterName: m.characterName || null,
          })),
        };
      });

    // 회차가 공연 기간 내에 있는지 확인
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    endDate.setHours(23, 59, 59, 999); // 종료일 끝까지 포함

    for (const session of validSessions) {
      const sessionDate = new Date(session.sessionDatetime);
      if (sessionDate < startDate || sessionDate > endDate) {
        setError('회차 일시는 공연 기간 내에 있어야 합니다.');
        return;
      }
    }

    setSubmitting(true);

    try {
      await updatePerformance(performanceId, {
        title: formData.title,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        sessions: validSessions,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/performances');
      }, 2000);
    } catch (err: any) {
      setError(err.message || '공연 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
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
              공연 정보 수정
            </h1>
            <p className={styles.headerSubtitle}>
              공연 정보 및 회차를 수정합니다
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link
              href="/admin/performances"
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
            </Link>
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
              ✅ 공연 정보가 성공적으로 수정되었습니다. 목록 페이지로 이동합니다...
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

          <form onSubmit={handleSubmit}>
            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                공연 제목 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={submitting || success}
                className={formStyles.input}
                placeholder="공연 제목을 입력하세요"
              />
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                시작일 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                disabled={submitting || success}
                className={formStyles.input}
              />
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                종료일 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                disabled={submitting || success}
                className={formStyles.input}
                min={formData.startDate || undefined}
              />
              <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                종료일은 시작일보다 이후여야 합니다.
              </small>
            </div>

            {/* 회차 정보 */}
            <div className={formStyles.formGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label className={formStyles.label} style={{ marginBottom: 0 }}>
                  공연 회차
                </label>
                <button
                  type="button"
                  onClick={addSession}
                  disabled={submitting || success}
                  style={{
                    padding: '6px 12px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                  }}
                >
                  + 회차 추가
                </button>
              </div>
              <small style={{ color: '#666', fontSize: '0.85rem', marginBottom: '15px', display: 'block' }}>
                공연 회차 정보를 입력하세요. 회차 일시는 공연 기간 내에 있어야 합니다.
              </small>
              
              {sessions.map((session, index) => (
                <div
                  key={session.id || index}
                  style={{
                    padding: '15px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    background: '#f9f9f9',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '600', color: '#333' }}>회차 {index + 1}</span>
                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSession(index)}
                        disabled={submitting || success}
                        style={{
                          padding: '4px 8px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}>
                        날짜
                      </label>
                      <input
                        type="date"
                        value={session.sessionDate}
                        onChange={(e) => handleSessionChange(index, 'sessionDate', e.target.value)}
                        disabled={submitting || success}
                        min={formData.startDate || undefined}
                        max={formData.endDate || undefined}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}>
                        시간
                      </label>
                      <input
                        type="time"
                        value={session.sessionTime}
                        onChange={(e) => handleSessionChange(index, 'sessionTime', e.target.value)}
                        disabled={submitting || success}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}>
                      메모 (선택)
                    </label>
                    <textarea
                      value={session.note}
                      onChange={(e) => handleSessionChange(index, 'note', e.target.value)}
                      disabled={submitting || success}
                      rows={2}
                      placeholder="회차별 메모를 입력하세요"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {/* 회차별 배우 정보 */}
                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>
                        출연 배우
                      </label>
                      <button
                        type="button"
                        onClick={() => addMemberToSession(index)}
                        disabled={submitting || success}
                        style={{
                          padding: '4px 8px',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        + 배우 추가
                      </button>
                    </div>

                    {session.members.length === 0 ? (
                      <div style={{ 
                        padding: '10px', 
                        background: '#f8f9fa', 
                        borderRadius: '6px', 
                        color: '#666', 
                        fontSize: '0.85rem',
                        textAlign: 'center',
                      }}>
                        배우 정보가 없습니다. 배우 추가 버튼을 클릭하여 추가하세요.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {session.members.map((member, memberIndex) => (
                          <div
                            key={memberIndex}
                            style={{
                              padding: '10px',
                              background: 'white',
                              border: '1px solid #ddd',
                              borderRadius: '6px',
                              display: 'grid',
                              gridTemplateColumns: '2fr 1.5fr 2fr auto',
                              gap: '10px',
                              alignItems: 'end',
                            }}
                          >
                            <div style={{ position: 'relative' }}>
                              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#666' }}>
                                배우 <span style={{ color: '#dc3545' }}>*</span>
                              </label>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <input
                                  type="text"
                                  value={memberSearchStates[getSearchKey(index, memberIndex)]?.query || (member.memberId ? members.find(m => m.id.toString() === member.memberId)?.name || '' : '')}
                                  onChange={(e) => handleMemberSearchInputChange(index, memberIndex, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleMemberSearch(index, memberIndex);
                                    }
                                  }}
                                  onFocus={() => {
                                    const key = getSearchKey(index, memberIndex);
                                    const searchState = memberSearchStates[key];
                                    if (searchState?.query.length >= 2) {
                                      handleMemberSearch(index, memberIndex);
                                    }
                                  }}
                                  disabled={submitting || success}
                                  placeholder="배우 이름 검색"
                                  required={!!member.memberId}
                                  style={{
                                    flex: 1,
                                    padding: '6px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '0.85rem',
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleMemberSearch(index, memberIndex)}
                                  disabled={submitting || success || !memberSearchStates[getSearchKey(index, memberIndex)]?.query || memberSearchStates[getSearchKey(index, memberIndex)].query.trim().length < 2}
                                  style={{
                                    padding: '6px 10px',
                                    background: memberSearchStates[getSearchKey(index, memberIndex)]?.query && memberSearchStates[getSearchKey(index, memberIndex)].query.trim().length >= 2 ? '#667eea' : '#ccc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: memberSearchStates[getSearchKey(index, memberIndex)]?.query && memberSearchStates[getSearchKey(index, memberIndex)].query.trim().length >= 2 ? 'pointer' : 'not-allowed',
                                    fontSize: '0.75rem',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title="검색"
                                >
                                  검색
                                </button>
                                {member.memberId && (
                                  <button
                                    type="button"
                                    onClick={() => handleMemberSearchClear(index, memberIndex)}
                                    disabled={submitting || success}
                                    style={{
                                      padding: '6px 10px',
                                      background: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '0.75rem',
                                    }}
                                    title="초기화"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                              {memberSearchStates[getSearchKey(index, memberIndex)]?.showResults && memberSearchStates[getSearchKey(index, memberIndex)].results.length > 0 && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  right: 0,
                                  background: 'white',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  marginTop: '2px',
                                  maxHeight: '150px',
                                  overflowY: 'auto',
                                  zIndex: 1000,
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                }}>
                                  {memberSearchStates[getSearchKey(index, memberIndex)].results.map((m) => (
                                    <div
                                      key={m.id}
                                      onClick={() => handleMemberSelect(index, memberIndex, m)}
                                      style={{
                                        padding: '8px 10px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #f0f0f0',
                                        fontSize: '0.85rem',
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#f0f4ff';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'white';
                                      }}
                                    >
                                      {m.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#666' }}>
                                역할 <span style={{ color: '#dc3545' }}>*</span>
                              </label>
                              <select
                                value={member.roleId}
                                onChange={(e) => handleMemberChange(index, memberIndex, 'roleId', e.target.value)}
                                disabled={submitting || success}
                                required
                                style={{
                                  width: '100%',
                                  padding: '6px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '0.85rem',
                                }}
                              >
                                <option value="">선택하세요</option>
                                {roles.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#666' }}>
                                배역이름
                              </label>
                              <input
                                type="text"
                                value={member.characterName}
                                onChange={(e) => handleMemberChange(index, memberIndex, 'characterName', e.target.value)}
                                disabled={submitting || success}
                                placeholder="배역이름 (선택)"
                                style={{
                                  width: '100%',
                                  padding: '6px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '0.85rem',
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMemberFromSession(index, memberIndex)}
                              disabled={submitting || success}
                              style={{
                                padding: '6px 10px',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                height: 'fit-content',
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button
                type="submit"
                disabled={submitting || success}
                className={formStyles.submitButton}
              >
                {submitting ? '수정 중...' : success ? '수정 완료' : '공연 정보 수정'}
              </button>
              <Link
                href="/admin/performances"
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
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

