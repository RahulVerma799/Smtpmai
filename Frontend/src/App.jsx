import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [rawEmails, setRawEmails] = useState(""); // raw input
  const [subject, setSubject] = useState(
    "Application for Full Stack Developer / ReactJS Developer / NodeJS Developer Role"
  );
  const [message, setMessage] = useState(`Hi,

I am writing to express my interest in a Full Stack developer role (MERN Stack) position, as advertised on LinkedIn. My skills and experience are a perfect match for the job requirements, and I am excited about the opportunity to contribute to your team.
my Portfolio=https://rahulportof.netlify.app

Thank you for considering my application. I look forward to your reply.

Best,
Rahul Verma
+91-7991180409`);
  const [file, setFile] = useState(null);
  const [scheduleTime, setScheduleTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [response, setResponse] = useState(null);

  // Clean emails when sending
  const cleanEmails = (input) => {
    return input
      .replace(/["'\n\r]/g, " ") // remove quotes & new lines
      .split(/[\s,]+/) // split by spaces or commas
      .filter((email) => email.includes("@")) // basic check
      .join(", "); // return cleaned, comma-separated string
  };

  const handleEmailsChange = (e) => {
    setRawEmails(e.target.value); // no cleaning while typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🕑 Delay if scheduled
    if (scheduleTime) {
      const sendTime = new Date(scheduleTime).getTime();
      const now = new Date().getTime();
      const delay = sendTime - now;

      if (delay > 0) {
        alert(`Email scheduled! Will send in ${Math.round(delay / 1000)} sec`);
        setTimeout(() => sendEmails(), delay);
        return;
      }
    }

    // Else, send immediately
    sendEmails();
  };

  const sendEmails = async () => {
    setLoading(true);
    setProgress(0);

    try {
      const cleaned = cleanEmails(rawEmails);
      const emailList = cleaned
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      let results = [];

      for (let i = 0; i < emailList.length; i++) {
        const formData = new FormData();
        formData.append("emails", emailList[i]);
        formData.append("subject", subject);
        formData.append("message", message);
        if (file) {
          formData.append("file", file);
        }

        const res = await axios.post("https://smtpmai.onrender.com/send", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        results.push(res.data);
        setProgress(i + 1);
      }

      setResponse({ message: "All emails sent!", results });
    } catch (err) {
      console.error(err);
      setResponse({ error: "Failed to send emails" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <form className="email-form" onSubmit={handleSubmit}>
        <h2>📧 Send Bulk Emails</h2>

        <label>Email Addresses (type or paste multiple)</label>
        <textarea
          rows="3"
          placeholder={`test1@gmail.com\ntest2@yahoo.com\ntest3@gmail.com`}
          value={rawEmails}
          onChange={handleEmailsChange}
          required
        />

        <label>Subject</label>
        <input
          type="text"
          placeholder="Enter email subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        <label>Message</label>
        <textarea
          rows="10"
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <label>Attach PDF</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <label>Schedule Time (optional)</label>
        <input
          type="datetime-local"
          value={scheduleTime}
          onChange={(e) => setScheduleTime(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Emails"}
        </button>
      </form>

      {loading && (
        <div className="progress">
          <p>Sending... {progress} sent</p>
        </div>
      )}

      {response && (
        <div className="response">
          <h3>Server Response:</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
