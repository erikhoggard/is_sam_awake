import React from "react";
import Router from "next/router";
import ReactMarkdown from "react-markdown";

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
  const authorName = post.author ? post.author.name : "Sam";
  return (
    <div onClick={() => Router.push("/update")}>
      <h2>{post.title}</h2>
      <ReactMarkdown children={post.content} />
      <style jsx>{`
        div {
          color: inherit;
          padding: 2rem;
        }
      `}</style>
      <i><small style={{ position: 'absolute', right: 50 }}>a message from {authorName}</small></i>
    </div>
  );
};

export default Post;
