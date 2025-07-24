import {useState, useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import "./ContactUs.css"
import MessageApi from "../../api/Messages";
import UserApi from "../../api/Users";

function ContactUs() {

    const [name,setName] = useState('');
    const [email,setEmail] = useState('');
    const [subject,setSubject] = useState('');
    const [message,setMessage] = useState('');
    const [submitstatus,setSubmitStatus] = useState('');
    // NEW: Rate limiting state
    const [messageCount, setMessageCount] = useState(0);
    const [firstMessageTime, setFirstMessageTime] = useState(null);

    // NEW: Load rate limit data on component mount
    useEffect(() => {
        const storedCount = localStorage.getItem('anonMessageCount');
        const storedTime = localStorage.getItem('anonFirstMessageTime');
        
        if (storedCount && storedTime) {
            const timeDiff = Date.now() - parseInt(storedTime);
            if (timeDiff > 600000) { // 10 minutes
                localStorage.removeItem('anonMessageCount');
                localStorage.removeItem('anonFirstMessageTime');
            } else {
                setMessageCount(parseInt(storedCount));
                setFirstMessageTime(parseInt(storedTime));
            }
        }
    }, []);

    UserApi.getSelf()
    .then(response => {
        if (!response.ok) {
            throw new Error("HTTP Error");
        }
        window.location.href = "/UserContactUs";

    })
    .catch(error => {
    })

    const submit = (name, email, subject, message) => {

        const emailpattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]/;
        if(!emailpattern.test(email)) {
            setSubmitStatus("Invalid Email");
            return;
        }

        const namepattern = /^[a-zA-Z]/;
        if(!namepattern.test(name)) {
            setSubmitStatus("Invalid Name");
            return;
        }

        const subjectpattern = /^[a-zA-Z0-9]/;
        if(!subjectpattern.test(subject)) {
            setSubmitStatus("Invalid Subject");
            return;
        }

        // NEW: Check rate limit
        const currentTime = Date.now();
        let currentCount = messageCount;
        let currentFirstTime = firstMessageTime;

        if (!firstMessageTime || (currentTime - firstMessageTime > 600000)) {
            currentCount = 0;
            currentFirstTime = currentTime;
            localStorage.setItem('anonFirstMessageTime', currentTime.toString());
            setFirstMessageTime(currentTime);
        }

        if (currentCount >= 3) {
            setSubmitStatus("⚠️ Rate limit exceeded! You can only send 3 messages in 10 minutes. Unless you're a Karen... I heard they can escalate things easily. Be kind is what we say to everyone, but some don't learn. 💅");
            return;
        }

        MessageApi.sendMessage(name, email, subject, message)
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP Error");
            }
            
            // NEW: Update rate limit counter
            const newCount = currentCount + 1;
            setMessageCount(newCount);
            localStorage.setItem('anonMessageCount', newCount.toString());
            
            setSubmitStatus("Message was sent successfully!");
        })
        .catch(error => {
            setSubmitStatus("Server Error");
        })
    }

    const myelement = (
        <div class="messagecenter">
            <h2 style={{textAlign: 'center'}} >Contact Us</h2>
            <div class="contactusdetails" >
                <p>For any questions please submit any questions below and one of our staff members will reach out via email.</p>
                <img class="messagecenter-logo" src="./images/logo.jpg" />
            </div>
            <div class="post-form" style={{textAlign: 'center'}}>
                <label for="name">Name:</label>
                <br></br>
                <input type="text" id="name" name="name" onChange={e => setName(e.target.value)} required/>
                <br></br>
                <br></br>
                <label for="emailaddress">Email Address:</label>
                <br></br>
                <input type="email" id="emailaddress" name="emailaddress" onChange={e => setEmail(e.target.value)} required/>
                <br></br>
                <br></br>
                <label for="subject">Subject:</label>
                <br></br>
                <input type="text" id="subject" name="subject" onChange={e => setSubject(e.target.value)} required/>
                <br></br>
                <br></br>
                <label for="message">Message:</label>
                <br></br>
                <textarea type="text" id="message" name="message" class="large-input" rows="4" cols="50" wrap="soft" onChange={e => setMessage(e.target.value)} required/>
                <br></br>
                <br></br>
                <button class="submitmessage" type="submit" formMethod="post" onClick={() => submit(name, email, subject, message)}>Submit</button>
                <br></br>
                <br></br>
                <p>{submitstatus}</p>
            </div>
        </div>
    );

    return myelement;
}

export default ContactUs;
