import React, { useEffect, useState } from "react"
import { useSession } from 'next-auth/react';
import Layout from "../components/Layout"
import Post, { PostProps } from "../components/Post"
import Swal from 'sweetalert2';
import styled from 'styled-components';

const HOURS_AWAKE = 16;
const HOURS_ASLEEP = 8;

const hoursDiff = (dt1: Date, dt2: Date) => {
  let diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= (60 * 60);
  return Math.abs(Math.round(diff));
}

const isSamAwake = (logEntry: any) => {
  if (logEntry.isAwake !== undefined) {
    const entry = logEntry;
    const offset = entry.offset;
    const wasRecentlyAwake = entry.isAwake;

    const d = new Date(entry.createdAt);
    d.setHours(d.getHours() + offset);
    const now = new Date();

    let isAwake: boolean;
    let status: string;
    const diff = hoursDiff(d, now)
    let remainder = (diff % 24);

    if (diff > 168) {
      status = 'UNKNOWN';
    } else if (d.getTime() > now.getTime() && wasRecentlyAwake === false) {
      // sleep planned within the next few hours
      status = "AWAKE";

      //TODO more in-depth date info??
    } else {
      if (wasRecentlyAwake) {
        isAwake = (remainder <= HOURS_AWAKE);
      } else {
        isAwake = (remainder > HOURS_ASLEEP);
      }
      status = isAwake === true ? "AWAKE" : "ASLEEP";
    }

    return { isAwake: isAwake, statusText: status, remainder: remainder };
  }

  return { isAwake: false, statusText: '...', remainder: 0 };
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
  const [update, setUpdate] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('...');
  const [hoursElapsed, setHoursElaplsed] = useState(24);
  const [updateMessage, setUpdateMessage] = useState({ text: '-', color: '100,100,255' });

  const [feed, setFeed] = useState([]);
  const [latestEntry, setLatestEntry] = useState({} as any);


  useEffect(() => {
    const fd = async () => {
      const data = await fetchData();
      setLatestEntry(data.latestEntry[0]);
      setFeed(data.feed);
    }
    fd().catch(console.error);
  }, [update])

  useEffect(() => {
    const wakeCheck = isSamAwake(latestEntry);

    const d = new Date(latestEntry.createdAt);
    d.setHours(d.getHours() + latestEntry.offset);
    const hoursElapsed = hoursDiff(d, new Date());
    let color = '0,0,0';
    let message: string;

    if (hoursElapsed <= 72) {
      if (wakeCheck.isAwake && (wakeCheck.remainder >= HOURS_AWAKE - 2 && wakeCheck.remainder <= HOURS_AWAKE && hoursElapsed <= HOURS_AWAKE)) {
        message = 'but he might be sleeping soon.'
        color = '100,100,255';
      } else if (!wakeCheck.isAwake && (wakeCheck.remainder >= HOURS_ASLEEP - 1 && wakeCheck.remainder <= HOURS_ASLEEP && hoursElapsed <= HOURS_ASLEEP)) {
        message = 'but he might be waking up soon.'
        color = '100,100,255';
      }
    }

    if (!message) {
      if (hoursElapsed < 24) {
        message = 'and I\'m SURE about it.';
        color = '0,155,0';
      } else if (hoursElapsed > 72) {
        message = 'samnTracker data 3+ days out of date.';
        color = '200,0,0';
      } else if (latestEntry.offset) {
        message = 'and this is PROBABLY correct.';
        color = '200,200,0';
      }
    }

    setCurrentStatus(wakeCheck.statusText);
    setUpdateMessage(
      {
        text: message,
        color: color
      }
    );

  }, [latestEntry]);

  const sendAwakenessEntry = async (isAwake: boolean) => {
    try {
      Swal.fire({
        title: 'Offset by x hours',
        text: 'When did/will this happen???',
        input: 'number',
        showCancelButton: true,
      }).then(async ({ isDismissed, value }) => {

        if (isDismissed) return Promise.resolve(false);

        let offset = parseInt(value);
        if (isNaN(offset)) offset = 0;

        const body = { isAwake: isAwake, offset: offset };

        const res = await fetch('/api/awakenessUpdate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.status === 200) {
          return Promise.resolve(true);
        } else {
          return Promise.reject(res);
        }
      }).then((shouldContinue: boolean) => {
        if (shouldContinue) {
          Swal.fire('CONGRATS', `You're ${isAwake ? 'AWAKE' : 'ASLEEP'}`, 'success')
        } else {
          return Promise.resolve();
        }
      }).then(() => setUpdate(update + 1))
        .catch(err => {
          Swal.fire('errrrrrrrrrrrrrrrrror', `${err}`, 'error')
        })

    } catch (error) {
      console.error(error);
    }
  };

  const HeaderDiv = styled.div`
    display:flex;
      flex-direction: column;
      justify-content: space-around;
    @media only screen and (min-width:900px) {
      flex-direction: row;
      justify-content: space-between;
    }
  `;

  const HeaderCertainty = styled.h3.attrs<{ color: string }>((props) => props)`
    color: rgb(${props => props.color});
    margin-top: 0em;
    margin-bottom:2em;
    @media only screen and (min-width:900px) {
      margin-top:1.5em;
      margin-bottom:2em;
    }
  `;

  return (
    <>
      <Layout>
        <div>
          <div className="page" >
            <HeaderDiv>
              <h1>Current Status: Sam is {currentStatus}</h1>
              <HeaderCertainty color={updateMessage.color}>{updateMessage.text}</HeaderCertainty>
            </HeaderDiv>
          </div>
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
