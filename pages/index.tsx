import React, { useEffect, useState } from "react"
import { GetStaticProps } from "next"
import { useSession } from 'next-auth/react';
import Layout from "../components/Layout"
import Post, { PostProps } from "../components/Post"
import prisma from '../lib/prisma';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Router from "next/router";

const isSamAwake = logEntry => {
  if (logEntry) {
    const entry = logEntry;
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

const fetchData = async () => {
  const latestEntry = await fetch('/api/getLatestEntry')
    .then((res) => res.json())
    .then((data) => {
      return data;
    })
  const feed = await fetch('/api/getMotd')
    .then((res) => res.json())
    .then((data) => {
      return data;
    })
  return { latestEntry: latestEntry, feed: feed }
}

const StatusUpdate: React.FC = () => {
  const { data: session } = useSession();
  // const swal = withReactContent(Swal);
  const [update, setUpdate] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');

  const [feed, setFeed] = useState([]);
  const [latestEntry, setLatestEntry] = useState('');


  useEffect(() => {
    const fd = async () => {
      const data = await fetchData();
      setLatestEntry(data.latestEntry[0]);
      setFeed(data.feed);
    }
    fd().catch(console.error);
  }, [update])

  useEffect(() => {
    setCurrentStatus(isSamAwake(latestEntry));
  }, [latestEntry]);

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
          .then(() => setUpdate(update + 1));
      } else {
        Swal.fire(res.statusText, `${res.status}`, 'error')
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
            {feed.map((post) => (
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
