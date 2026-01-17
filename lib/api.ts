const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface Member {
  id: number;
  name: string;
  birthDate: string;
  phone?: string;
  memberLevelId: number;
  roleId: number;
  profileVisible: boolean;
  firstJoinedAt: string;
  createdAt: string;
  updatedAt: string;
  memberLevel?: {
    id: number;
    name: string;
    description?: string;
  };
  role?: {
    id: number;
    code: string;
    name: string;
    description?: string;
  };
}

export async function searchMembers(query: string): Promise<Member[]> {
  try {
    const url = `${API_BASE_URL}/members?name=${encodeURIComponent(query)}`;
    console.log('Searching members with URL:', url);
    const response = await fetch(url);
    console.log('Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`Failed to search members: ${response.status}`);
    }
    const data = await response.json();
    console.log('Search results:', data);
    return data;
  } catch (error) {
    console.error('Error searching members:', error);
    return [];
  }
}

export async function getAllMembers(): Promise<Member[]> {
  try {
    const url = `${API_BASE_URL}/members`;
    console.log('Fetching all members from:', url);
    const response = await fetch(url);
    console.log('Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`Failed to fetch members: ${response.status}`);
    }
    const data = await response.json();
    console.log('All members:', data);
    return data;
  } catch (error) {
    console.error('Error fetching members:', error);
    return [];
  }
}

