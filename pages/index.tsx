import React, { useEffect, useState } from "react"
import { GetStaticProps } from "next"
import { useSession } from 'next-auth/react';
import Layout from "../components/Layout"
import Post, { PostProps } from "../components/Post"
import prisma from '../lib/prisma';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Router from "next/router";

// index.tsx
export const getStaticProps: GetStaticProps = async () => {

  const feed = await prisma.post.findMany({
    where: { published: false },
    include: {
      author: {
        select: { name: true },
      },
    },
    orderBy: {
      createdAt: 'desc'
    } as any,
    take: 1
  });

  const latestEntry = await prisma.logEntry.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 1
  });


  return {
    props: {
      latestEntry: JSON.stringify(latestEntry),
      feed: JSON.stringify(feed)
    },
    revalidate: 10,
  };

};

type Props = {
  feed: PostProps[]
  latestEntry: PostProps[]
}


const isSamAwake = logEntry => {
  if (logEntry) {
    const entry = JSON.parse(logEntry)[0];
    const d = new Date(entry.createdAt);
    const now = new Date();

    const hoursDiff = (dt1, dt2) => {
      let diff = (dt2.getTime() - dt1.getTime()) / 1000;
      diff /= (60 * 60);
      return Math.abs(Math.round(diff));
    }

    let isAwake = entry.isAwake;
    let status: string;
    const diff = hoursDiff(d, now)

    if (diff > 168) {
      status = 'UNKNOWN';
      //TODO more in-depth date info??
    } else {
      if (diff % 24 > 16) {
        isAwake = !isAwake
      }
      status = isAwake === true ? "PROBABLY AWAKE" : "PROBABLY ASLEEP";
    }

    return status;
  }
}

const StatusUpdate: React.FC<Props> = (props) => {
  const { data: session } = useSession();
  // const swal = withReactContent(Swal);
  const [currentStatus, setCurrentStatus] = useState('');

  useEffect(() => {
    setCurrentStatus(isSamAwake(props.latestEntry));
    alert(props.latestEntry);
  }, [props]);

  const sendAwakenessEntry = async (isAwake: boolean) => {
    try {
      const body = { isAwake: isAwake };
      const res = await fetch('/api/awakenessUpdate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 200) {
        Swal.fire('CONGRATS', `You're ${isAwake ? 'AWAKE' : 'ASLEEP'}`, 'success')
          .then(() => {
            Router.replace(Router.asPath);
          });
      } else {
        Swal.fire(res.statusText, `${res.status}`, 'error')
          .then(() => {
            Router.replace(Router.asPath);
          });
      }

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Layout>
        <div className="page" >
          <h1>Current Status: {currentStatus}</h1>
          <main>
            {JSON.parse(props.feed as unknown as string).map((post) => (
              <div key={post.id} className="post">
                <Post post={post} />
              </div>
            ))}
          </main>
        </div>
        <style jsx>{`
        .post {
          background: white;
          transition: box-shadow 0.1s ease-in;
        }

        .post:hover {
          box-shadow: 1px 1px 3px #aaa;
        }

        .post + .post {
          margin-top: 2rem;
        }
      `}</style>
      </Layout>
      {
        session && <div style={{ justifyContent: "flex-start", width: "100%", display: "flex", flex: 1, marginTop: 20, flexDirection: "row", alignContent: "space-evenly" }}>
          <button onClick={() => sendAwakenessEntry(true)} style={{ flex: 1, marginLeft: 40, marginRight: 20 }}>I am currently awake</button>
          <button onClick={() => sendAwakenessEntry(false)} style={{ flex: 1, marginLeft: 20, marginRight: 40 }}>I am currently asleep</button>
          <style jsx>{`
              button {
                border: none;
              }
      `}</style>
        </div>
      }
    </>
  )
}

export default StatusUpdate 
