import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import "./UserContactUs.css";
import MessageApi from '../../api/Messages';
import Modal from "../Admin/ContactUsModal";
import UserApi from "../../api/Users";    

function UserContactUs() {
    const [results, setResults] = useState([]);
    const [messageStatus, setMessageStatus] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
    const [messagesentStatus, setMessageSentStatus] = useState('');
    const [contactSubject, setContactSubject] = useState('');
    const [contactMessage, setContactMessage] = useState('');
    // NEW: Rate limiting state
    const [messageCount, setMessageCount] = useState(0);
    const [firstMessageTime, setFirstMessageTime] = useState(null);
    const [rateLimitMessage, setRateLimitMessage] = useState('');

    UserApi.getSelf()
    .then(response => {
        if (!response.ok) {
            throw new Error("HTTP Error");
        }
    })
    .catch(error => {
        window.location.href = "/ContactUs";
    })

    useEffect(() => {
        // NEW: Load rate limit data from localStorage
        const storedCount = localStorage.getItem('userMessageCount');
        const storedTime = localStorage.getItem('userFirstMessageTime');
        
        if (storedCount && storedTime) {
            const timeDiff = Date.now() - parseInt(storedTime);
            // Reset if 10 minutes (600000ms) have passed
            if (timeDiff > 600000) {
                localStorage.removeItem('userMessageCount');
                localStorage.removeItem('userFirstMessageTime');
            } else {
                setMessageCount(parseInt(storedCount));
                setFirstMessageTime(parseInt(storedTime));
            }
        }

        MessageApi.getMessages()
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP Error");
            }
            return response.json();
        })
        .then(data => {
            const currentresults = Array();
            data.forEach(item => {
                const object = {"subject": item.subject, "message": item.message, "id": item.id, "isRead": item.isRead, "createdAt": item.createdAt, "adminReply": item.adminReply};
                currentresults.push(object);
            })
            setResults(currentresults);
        })
        .catch(error => {
            setMessageStatus("Server error");
        })

    }, [])

    const submit = (subject, message) => {
        // NEW: Check rate limit
        const currentTime = Date.now();
        let currentCount = messageCount;
        let currentFirstTime = firstMessageTime;

        // If first message or 10 minutes passed, reset
        if (!firstMessageTime || (currentTime - firstMessageTime > 600000)) {
            currentCount = 0;
            currentFirstTime = currentTime;
            localStorage.setItem('userFirstMessageTime', currentTime.toString());
            setFirstMessageTime(currentTime);
        }

        // Check if rate limited
        if (currentCount >= 3) {
            setRateLimitMessage("⚠️ Rate limit exceeded! You can only send 3 messages in 10 minutes. Unless you're a Karen... I heard they can escalate things easily. Be kind is what we say to everyone, but some don't learn. 💅");
            return;
        }

        MessageApi.sendAuthenticatedMessage(subject, message)
        .then(response => {
            if (!response.ok) {
                setMessageSentStatus("Message could not be sent, please try again later");
                return;
            }
            
            // NEW: Update rate limit counter
            const newCount = currentCount + 1;
            setMessageCount(newCount);
            localStorage.setItem('userMessageCount', newCount.toString());
            
            setMessageSentStatus("Message was sent successfully!");
            setTimeout(() => {
                window.location.href="/UserContactUs";
            }, 900);
        })
        .catch(error => {
            return;
        })
    }

    const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
    };
    
    function sortdata(results) {
        const sortedData = [...results].sort((a, b) => {
            if (sortConfig !== null) {
                const { key, direction } = sortConfig;
                if (a[key] < b[key]) {
                    return direction === 'ascending' ? -1 : 1;
                }
                if (a[key] > b[key]) {
                    return direction === 'ascending' ? 1 : -1;
                }
            }
            return 0;
        });

        return sortedData;
    }
    
    const [open , setOpen] = React.useState(false);

    const handleClose = () => {
        setOpen(false);
    };

    const handleOpen = (id) => {
        setOpen(id);
    };

    return <div class="user-contactus-body">
        <h1>Contact an Admin</h1>
        <table class="contactus-center center">
            
            <thead>
                <tr>
                <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                    Sent On {sortConfig.key === 'createdAt' && (sortConfig.direction === 'ascending' ? '▴' : '▾')}
                </th>
                <th onClick={() => handleSort('subject')} style={{ cursor: 'pointer' }}>
                    Subject {sortConfig.key === 'subject' && (sortConfig.direction === 'ascending' ? '▴' : '▾')}
                </th>
                <th>Options</th>
                </tr>
            </thead>
            <tbody>
                {sortdata(results).map((user, index) => (
                    <tr key={index}>
                        <td>{user.createdAt}</td>
                        <td>{user.subject}</td>
                        <td>
                            <button type="button" class="admin-button" onClick={() => handleOpen(index)} id={index}>View</button>
                        </td>
                        <Modal width='500px' isOpen={open===index} id={index} onClose={handleClose} >
                            <p style={{'fontSize': 'xx-large'}} >Subject: {user.subject}</p>
                            <p style={{'fontSize': 'large'}} >Message: {user.message}</p>
                            <p style={{'fontSize': 'xx-large'}} >Admin Response: </p>
                            <p style={{'fontSize': 'large'}} >{user.adminReply || 'pending'}</p>
                            <br></br>
                            <button class="admin-button" onClick={handleClose}>Close</button>
                        </Modal>
                    </tr>
                ))}
            </tbody>
        </table>
        <button class="admin-button" onClick={() => handleOpen("contact")} id="contact">Contact</button>
        <Modal isOpen={open==='contact'} onClose={handleClose} id="contact">
                <p>Subject: </p>
                <input type="text" onChange={e => setContactSubject(e.target.value)}></input>
                <p>Message: </p>
                <textarea class="contactus-textarea" type="text" id="message" onChange={e => setContactMessage(e.target.value)}></textarea>
                <br></br>
                <button class="admin-button" onClick={() => submit(contactSubject, contactMessage)}>Send</button>
                <button class="admin-button" onClick={handleClose}>Close</button>
                <br></br>
                {messagesentStatus}
                {/* NEW: Rate limit message display */}
                {rateLimitMessage && (
                    <div className="rate-limit-warning">
                        {rateLimitMessage}
                    </div>
                )}
        </Modal>
    </div>
}

export default UserContactUs;
