'use client';

import { Member } from '@/lib/api';

interface MemberListProps {
  members: Member[];
  loading: boolean;
  searchQuery: string;
}

export default function MemberList({ members, loading, searchQuery }: MemberListProps) {
  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#666',
      }}>
        검색 중...
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#999',
      }}>
        {searchQuery ? `"${searchQuery}"에 대한 검색 결과가 없습니다.` : '검색어를 입력하고 검색 버튼을 눌러주세요.'}
      </div>
    );
  }

  return (
    <div>
      <div style={{
        marginBottom: '20px',
        color: '#666',
        fontSize: '0.9rem',
      }}>
        {searchQuery && `"${searchQuery}" 검색 결과: ${members.length}명`}
      </div>
      <div style={{
        display: 'grid',
        gap: '16px',
      }}>
        {members.map((member) => (
          <div
            key={member.id}
            style={{
              padding: '20px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              background: '#f9f9f9',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f0f0';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f9f9f9';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '10px',
            }}>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: '600',
                color: '#333',
              }}>
                {member.name}
              </h3>
            </div>
            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}>
              {member.memberLevel && (
                <span style={{
                  padding: '4px 12px',
                  background: '#667eea',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                }}>
                  {member.memberLevel.name}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

