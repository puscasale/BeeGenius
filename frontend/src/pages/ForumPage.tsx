import React, { useEffect, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { FaRegComment } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import Header from '../components/Header';
import Menu from '../components/Menu';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getTagColor } from '../utils/tagColorGenerator';
import '../utils/Notify_style.css';
import { notifyError, notifySuccess } from '../utils/Notify';

interface JwtPayload {
    id: string;
}

type Post = {
    id: string;
    title: string;
    content: string;
    timeAgo: string;
    tags?: string[];
    user?: {
        id: string;
        name: string;
    };
    repliesCount: number;
};

const GlobalStyle = createGlobalStyle`
    @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600&display=swap');
    body {
        margin: 0;
        padding: 0;
        font-family: 'Josefin Sans', sans-serif;
        background-color: #fcf6e8;
    }
`;

const Container = styled.div`
    padding: 110px 40px;
`;

const PageWrapper = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
`;

const SectionTitle = styled.h2`
    font-size: 2rem;
    margin: 30px 0 20px;
    width: fit-content;
`;

const DescriptionBox = styled.div`
    background-color: #fff4c2;
    padding: 24px 30px;
    border-radius: 12px;
    font-size: 1.15rem;
    margin-bottom: 30px;
    color: #333;
    line-height: 1.7;
    width: 100%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;


const Tag = styled.span<{ color: string }>`
    background: ${(props) => props.color};
    color: white;
    border-radius: 15px;
    padding: 4px 12px;
    font-size: 0.9rem;
    font-weight: 600;
`;

const InfoRow = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
    flex-wrap: wrap;
`;

const ForumPostCard = styled.div`
    background: #d5d0c4;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 16px;
    &:hover {
        transform: scale(1.01);
    }
`;

const PostHeader = styled.div`
    font-size: 0.95rem;
    color: #222;
    margin-bottom: 8px;
`;

const PostTitle = styled.div`
    font-size: 1.3rem;
    font-weight: 600;
`;

const PostContent = styled.div`
    font-size: 1rem;
    color: #333;
    margin-top: 6px;
`;

const Toolbar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 10px;
    flex-wrap: wrap;
`;

const ToolbarSection = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

const Underline = styled.div`
    height: 2px;
    width: 100%;
    background-color: black;
    margin: 10px 0 30px;
`;

const SearchBar = styled.div`
    display: flex;
    align-items: center;
    padding: 10px 15px;
    border-radius: 10px;
    background-color: white;
    border: 1px solid #ccc;
    flex: 1;
    max-width: 500px;
`;

const SearchInput = styled.input`
    border: none;
    outline: none;
    font-size: 1rem;
    background: transparent;
    margin-left: 8px;
    width: 100%;
`;

const TagFilter = styled.select`
    padding: 10px;
    font-size: 1rem;
    border-radius: 10px;
    border: 1px solid #ccc;
    background-color: white;
    min-width: 200px;
`;

const PostReplies = styled.div`
    margin-top: 10px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #555;
`;

const PostLoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    font-size: 1.2rem;
    color: #555;
`;

const Description = styled.div`
    margin-top: 8px;
    font-size: 0.95rem;
    color: #222;
    line-height: 1.4;
`;

const FloatingButton = styled.button<{ open: boolean }>`
    position: fixed;
    bottom: 30px;
    right: 30px;
    background-color: #ffc107;
    color: black;
    border: none;
    padding: 15px 25px;
    border-radius: 50px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    z-index: ${(props) => (props.open ? 999 : 1000)};
    &:hover {
        background-color: #e6b800;
    }
`;

const ForumPage: React.FC = () => {
    const [showMenu, setShowMenu] = useState(false);
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [userId, setUserId] = useState<string>('');
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const token = sessionStorage.getItem("token");
    const BASE_URL = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
        fetch(`${BASE_URL}/api/tags`, {
            headers: {
                "Authorization": `Bearer ${token}`,
            }
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to load tags');
                return res.json();
            })
            .then((data: string[]) => setAvailableTags(data))
            .catch(err => console.error('Error loading tags:', err));
    }, []);

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (token) {
            const decoded = jwtDecode<JwtPayload>(token);
            setUserId(decoded.id);
        }

        fetch(`${BASE_URL}/api/posts`, {
            headers: {
                "Authorization": `Bearer ${token}`,
            }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAllPosts(data);
                } else if (Array.isArray(data.posts)) {
                    setAllPosts(data.posts);
                } else {
                    console.error('Expected an array but got:', data);
                    setAllPosts([]);
                }
            })
            .catch(err => {
                console.error('Error fetching posts:', err);
                setAllPosts([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string) => {
        const token = sessionStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${BASE_URL}/api/posts/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setAllPosts(prev => prev.filter(post => post.id !== id));
                setPostToDelete(null);
                notifySuccess('Post deleted successfully');
            } else {
                notifyError('Could not delete the post.');
            }
        } catch (e) {
            console.error('Delete error:', e);
            notifyError('An unexpected error occurred.');
        }
    };

    const filteredPosts = allPosts.filter(post => {
        const matchesSearch =
            post.title.toLowerCase().includes(search.toLowerCase()) ||
            post.content.toLowerCase().includes(search.toLowerCase());
        const matchesTag = !selectedTag || post.tags?.includes(selectedTag);
        return matchesSearch && matchesTag;
    });

    const Icon = FiSearch as React.ElementType;
    const Icon_Comm = FaRegComment as React.ElementType;

    return (
        <>
            <GlobalStyle />
            <PageWrapper>
                <Header toggleMenu={() => setShowMenu(v => !v)} />
                <Menu open={showMenu} />
                <Container>
                    <Toolbar>
                        <ToolbarSection>
                            <SectionTitle>Forum</SectionTitle>
                        </ToolbarSection>

                        <SearchBar>
                            <Icon />
                            <SearchInput
                                type="text"
                                placeholder="Search posts"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </SearchBar>

                        <TagFilter
                            value={selectedTag}
                            onChange={e => setSelectedTag(e.target.value)}
                        >
                            <option value="">All Tags</option>
                            {availableTags.map(tag => (
                                <option key={tag} value={tag}>
                                    {tag.replace('_', ' ')}
                                </option>
                            ))}
                        </TagFilter>
                    </Toolbar>


                    <Underline />

                    <Description style={{ fontSize: '1.1rem', background: '#f4f0e5', padding: '20px', borderRadius: '12px', margin: '20px 0 40px' }}>
                        This is your space to <strong>ask questions</strong>, <strong>share knowledge</strong>, and <strong>connect with others </strong>
                         who are just as passionate about learning. Post your thoughts, engage in conversations, and contribute
                        to a supportive and active educational community. Let’s build wisdom together! 🧠💬
                    </Description>

                    {loading ? (
                        <PostLoadingContainer>Loading posts...</PostLoadingContainer>
                    ) : (
                        [...filteredPosts]
                            .reverse()
                            .map(post => (
                                <ForumPostCard key={post.id}>
                                    <PostHeader>
                                        {post.user?.name || 'Anonymous'} • {post.timeAgo}
                                    </PostHeader>
                                    <PostTitle onClick={() => navigate(`/post/${post.id}`)}>
                                        {post.title}
                                    </PostTitle>
                                    <PostContent onClick={() => navigate(`/post/${post.id}`)}>
                                        {post.content}
                                    </PostContent>
                                    <InfoRow>
                                        {post.tags?.map((tag, i) => (
                                            <Tag key={i} color={getTagColor(tag)}>
                                                {tag.replace('_', ' ')}
                                            </Tag>
                                        ))}
                                    </InfoRow>
                                    <PostReplies>
                                        <Icon_Comm />
                                        {post.repliesCount}
                                    </PostReplies>

                                    {post.user?.id === userId && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                marginTop: '10px',
                                            }}
                                        >
                                            <button
                                                onClick={() => setPostToDelete(post.id)}
                                                style={{
                                                    background: '#f44336',
                                                    color: '#fcf6e8',
                                                    padding: '6px 14px',
                                                    fontWeight: 'bold',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </ForumPostCard>
                            ))
                    )}

                    <FloatingButton open={showMenu} onClick={() => navigate('/add-post')}>
                        Add Post
                    </FloatingButton>
                </Container>
            </PageWrapper>

            {postToDelete && (
                <ConfirmModal
                    isOpen={true}
                    message="Are you sure you want to delete this post?"
                    onCancel={() => setPostToDelete(null)}
                    onConfirm={() => handleDelete(postToDelete)}
                />
            )}
        </>
    );
};

export default ForumPage;
