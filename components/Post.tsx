import React from "react";
import Router from "next/router";
import ReactMarkdown from "react-markdown";
import { useSession } from 'next-auth/react';

export type PostProps = {
  id: string;
  title: string;
  author: {
    name: string;
    email: string;
  } | null;
  content: string;
  published: boolean;
};

const Post: React.FC<{ post: PostProps }> = ({ post }) => {
  const { data: session } = useSession();
  const authorName = post.author ? post.author.name : "Sam";
  return (
    <div onClick={() => { if (session && session.user) Router.push("/update") }}>
      <h2>{post.title}</h2>
      <ReactMarkdown children={post.content} />
      <style jsx>{`
        div {
          color: inherit;
          padding: 2rem;
        }
      `}</style>
      <i><small style={{ position: 'absolute', right: 50 }}>a message from {authorName}</small></i>
    </div >
  );
};

export default Post;
