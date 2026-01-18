import { getCachedData, setCachedData, clearCache, invalidateCachePattern } from './apiCache';
import { dedupeRequest } from './apiRequestDedupe';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// 토큰 가져오기
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('adminToken');
  }
  return null;
};

// API 요청 헬퍼
const apiRequest = async (endpoint: string, options: RequestInit = {}, useCache: boolean = false) => {
  const cacheKey = options.method === 'GET' && useCache ? `api:${endpoint}` : null;
  
  // GET 요청이고 캐시가 활성화된 경우 캐시 확인
  if (cacheKey) {
    const cached = getCachedData(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // GET 요청이고 캐시가 활성화된 경우 요청 중복 방지
  const requestKey = options.method === 'GET' && useCache ? `request:${endpoint}` : null;
  
  const executeRequest = async () => {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        // 인증 실패 시 로그인 페이지로
        if (typeof window !== 'undefined') {
          localStorage.removeItem('adminToken');
          clearCache(); // 인증 실패 시 캐시 클리어
          window.location.href = '/admin/login';
        }
        throw new Error('인증이 필요합니다.');
      }
      const error = await response.json().catch(() => ({ error: '요청 실패' }));
      throw new Error(error.error || '요청 실패');
    }

    const data = await response.json();
    
    // GET 요청이고 캐시가 활성화된 경우 캐시에 저장
    if (cacheKey && options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
      setCachedData(cacheKey, data);
    }

    return data;
  };

  // 요청 중복 방지 적용
  if (requestKey) {
    return dedupeRequest(requestKey, executeRequest);
  }

  return executeRequest();
};

// 관리자 정보
export const getAdminMe = () => apiRequest('/admin/me');
export const getAllAdmins = () => apiRequest('/admin');
export const getAdminById = (id: number) => apiRequest(`/admin/${id}`);
export const createAdmin = (data: any) => 
  apiRequest('/admin', { method: 'POST', body: JSON.stringify(data) });
export const updateAdmin = (id: number, data: any) =>
  apiRequest(`/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAdmin = (id: number) =>
  apiRequest(`/admin/${id}`, { method: 'DELETE' });

// 멤버 관리
export const getAllMembers = () => apiRequest('/members', {}, true);
export const getMemberById = (id: number) => apiRequest(`/members/${id}`);
export const createMember = async (data: any) => {
  invalidateCachePattern('/members');
  return apiRequest('/members', { method: 'POST', body: JSON.stringify(data) });
};
export const updateMember = async (id: number, data: any) => {
  invalidateCachePattern('/members');
  return apiRequest(`/members/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};
export const deleteMember = async (id: number) => {
  invalidateCachePattern('/members');
  return apiRequest(`/members/${id}`, { method: 'DELETE' });
};

// 단원 레벨
export const getAllMemberLevels = () => apiRequest('/member-levels');
export const getMemberLevelById = (id: number) => apiRequest(`/member-levels/${id}`);
export const createMemberLevel = (data: any) =>
  apiRequest('/member-levels', { method: 'POST', body: JSON.stringify(data) });
export const updateMemberLevel = (id: number, data: any) =>
  apiRequest(`/member-levels/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteMemberLevel = (id: number) =>
  apiRequest(`/member-levels/${id}`, { method: 'DELETE' });

// 역할
export const getAllRoles = () => apiRequest('/roles');
export const getRoleById = (id: number) => apiRequest(`/roles/${id}`);
export const createRole = (data: any) =>
  apiRequest('/roles', { method: 'POST', body: JSON.stringify(data) });
export const updateRole = (id: number, data: any) =>
  apiRequest(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRole = (id: number) =>
  apiRequest(`/roles/${id}`, { method: 'DELETE' });

// 정기모임 스케줄
export const getRegularMeetingSchedules = () => apiRequest('/regular-meeting-schedules', {}, true);
export const createRegularMeetingSchedule = async (data: any) => {
  invalidateCachePattern('/regular-meeting-schedules');
  return apiRequest('/regular-meeting-schedules', { method: 'POST', body: JSON.stringify(data) });
};
export const updateRegularMeetingSchedule = async (id: number, data: any) => {
  invalidateCachePattern('/regular-meeting-schedules');
  return apiRequest(`/regular-meeting-schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};
export const deleteRegularMeetingSchedule = async (id: number) => {
  invalidateCachePattern('/regular-meeting-schedules');
  return apiRequest(`/regular-meeting-schedules/${id}`, { method: 'DELETE' });
};

// 정기모임 참석
export const getRegularMeetingAttendances = (params?: { regularMeetingScheduleId?: number; memberId?: number }) => {
  const query = new URLSearchParams();
  if (params?.regularMeetingScheduleId) query.append('regularMeetingScheduleId', params.regularMeetingScheduleId.toString());
  if (params?.memberId) query.append('memberId', params.memberId.toString());
  return apiRequest(`/regular-meeting-attendances?${query.toString()}`);
};
export const createRegularMeetingAttendance = (data: any) =>
  apiRequest('/regular-meeting-attendances', { method: 'POST', body: JSON.stringify(data) });
export const updateRegularMeetingAttendance = (id: number, data: any) =>
  apiRequest(`/regular-meeting-attendances/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRegularMeetingAttendance = (id: number) =>
  apiRequest(`/regular-meeting-attendances/${id}`, { method: 'DELETE' });

// 당일 대관 신청
export const getSameDayRentalRequests = (params?: { status?: string; applicantMemberId?: number }) => {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.applicantMemberId) query.append('applicantMemberId', params.applicantMemberId.toString());
  return apiRequest(`/same-day-rental-requests?${query.toString()}`);
};
export const createSameDayRentalRequest = (data: any) =>
  apiRequest('/same-day-rental-requests', { method: 'POST', body: JSON.stringify(data) });
export const updateSameDayRentalRequest = (id: number, data: any) =>
  apiRequest(`/same-day-rental-requests/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSameDayRentalRequest = (id: number) =>
  apiRequest(`/same-day-rental-requests/${id}`, { method: 'DELETE' });
export const approveSameDayRentalRequest = (id: number, data?: any) =>
  apiRequest(`/same-day-rental-requests/${id}/approve`, { method: 'POST', body: JSON.stringify(data || {}) });

// 대관 스케줄
export const getRentalSchedules = () => apiRequest('/rental-schedules', {}, true);
export const getRentalScheduleById = (id: number) => apiRequest(`/rental-schedules/${id}`);
export const createRentalSchedule = async (data: any) => {
  invalidateCachePattern('/rental-schedules');
  return apiRequest('/rental-schedules', { method: 'POST', body: JSON.stringify(data) });
};
export const updateRentalSchedule = async (id: number, data: any) => {
  invalidateCachePattern('/rental-schedules');
  return apiRequest(`/rental-schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};
export const deleteRentalSchedule = async (id: number) => {
  invalidateCachePattern('/rental-schedules');
  return apiRequest(`/rental-schedules/${id}`, { method: 'DELETE' });
};

// 회비 납부
export const getMembershipFeePayments = (params?: any) => {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, value.toString());
      }
    });
  }
  return apiRequest(`/membership-fee-payments?${query.toString()}`);
};

// 대관비 납부
export const getRentalPayments = (params?: any) => {
  const query = new URLSearchParams();
  if (params?.rentalScheduleId) query.append('rentalScheduleId', params.rentalScheduleId.toString());
  return apiRequest(`/rental-payments?${query.toString()}`);
};

// 회비 정책
export const getMembershipFeePolicies = () => apiRequest('/membership-fee-policies', {}, true);
export const getMembershipFeePolicyById = (id: number) => apiRequest(`/membership-fee-policies/${id}`);
export const createMembershipFeePolicy = async (data: any) => {
  invalidateCachePattern('/membership-fee-policies');
  return apiRequest('/membership-fee-policies', { method: 'POST', body: JSON.stringify(data) });
};
export const updateMembershipFeePolicy = async (id: number, data: any) => {
  invalidateCachePattern('/membership-fee-policies');
  return apiRequest(`/membership-fee-policies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};
export const deleteMembershipFeePolicy = async (id: number) => {
  invalidateCachePattern('/membership-fee-policies');
  return apiRequest(`/membership-fee-policies/${id}`, { method: 'DELETE' });
};

// 회비 납부
export const createMembershipFeePayment = (data: any) =>
  apiRequest('/membership-fee-payments', { method: 'POST', body: JSON.stringify(data) });
export const updateMembershipFeePayment = (id: number, data: any) =>
  apiRequest(`/membership-fee-payments/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// 공연 정보
export const getAllPerformances = () => apiRequest('/performances', {}, true);
export const getPerformanceById = (id: number) => apiRequest(`/performances/${id}`);
export const createPerformance = async (data: any) => {
  invalidateCachePattern('/performances');
  return apiRequest('/performances', { method: 'POST', body: JSON.stringify(data) });
};
export const updatePerformance = async (id: number, data: any) => {
  invalidateCachePattern('/performances');
  return apiRequest(`/performances/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};
export const deletePerformance = async (id: number) => {
  invalidateCachePattern('/performances');
  return apiRequest(`/performances/${id}`, { method: 'DELETE' });
};

