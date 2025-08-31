import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [emails, setEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [scheduleTime, setScheduleTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [response, setResponse] = useState(null);

  // 🧹 Clean pasted emails (remove quotes, spaces, make comma-separated)
  const cleanEmails = (input) => {
    return input
      .replace(/["'\n\r]/g, " ") // remove quotes & new lines
      .split(/[\s,]+/) // split by spaces or commas
      .filter((email) => email.includes("@")) // keep valid-looking
      .join(", "); // join back with commas
  };

  const handleEmailsChange = (e) => {
    const raw = e.target.value;
    setEmails(cleanEmails(raw));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🕑 If schedule time is given, calculate delay
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

    // else send immediately
    sendEmails();
  };

  const sendEmails = async () => {
    setLoading(true);
    setProgress(0);

    try {
      const emailList = emails.split(",").map((e) => e.trim()).filter(Boolean);
      let results = [];

      for (let i = 0; i < emailList.length; i++) {
        const formData = new FormData();
        formData.append("emails", emailList[i]); // send one by one
        formData.append("subject", subject);
        formData.append("message", message);
        if (file) {
          formData.append("file", file);
        }

        const res = await axios.post("http://localhost:4000/send", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        results.push(res.data);
        setProgress(i + 1); // update progress after each
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

        <label>Email Addresses (paste multiple)</label>
        <textarea
          rows="3"
          placeholder={`test1@gmail.com\ntest2@yahoo.com\ntest3@gmail.com`}
          value={emails}
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
          rows="5"
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

      {/* Progress Section */}
      {loading && (
        <div className="progress">
          <p>Sending... {progress} sent</p>
        </div>
      )}

      {/* Response Section */}
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
