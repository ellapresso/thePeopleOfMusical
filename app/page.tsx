'use client';

import { useState, useEffect } from 'react';
import { searchMembers, getAllMembers, type Member } from '@/lib/api';
import SearchBar from '@/components/SearchBar';
import MemberList from '@/components/MemberList';

export default function Home() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      // 검색어가 없으면 데이터 초기화
      setMembers([]);
      return;
    }

    setLoading(true);
    const results = await searchMembers(query);
    setMembers(results);
    setLoading(false);
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      maxWidth: '800px',
      margin: '0 auto',
    }}>
      {/* 관리자 로그인 버튼 */}
      <div style={{
        position: 'absolute',
        top: '-60px',
        right: '0',
      }} className="admin-login-button-container">
        <a
          href="/admin/login"
          style={{
            padding: '10px 20px',
            background: 'white',
            color: '#667eea',
            border: '2px solid #667eea',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease',
            display: 'inline-block',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#667eea';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = '#667eea';
          }}
        >
          관리자 로그인
        </a>
      </div>

      <main style={{
        width: '100%',
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '10px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
        }}>
          The People Of Musical
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '30px',
          fontSize: '1.1rem',
        }}>
          단원 검색
        </p>

        <SearchBar onSearch={handleSearch} loading={loading} />

        <MemberList members={members} loading={loading} searchQuery={searchQuery} />
      </main>
    </div>
  );
}

