// Local test double only. Never bind this unauthenticated server outside loopback.
import net from "node:net";
import { appendFileSync } from "node:fs";
const outbox = process.env.SMTP_TEST_OUTBOX;
if (!outbox) throw new Error("Set SMTP_TEST_OUTBOX to a private test file.");
net.createServer((socket) => {
  let buffer = "", data = false, message = "";
  socket.write("220 localhost ESMTP test fixture\r\n");
  socket.on("data", (chunk) => {
    buffer += chunk.toString();
    for (;;) {
      const index = buffer.indexOf("\r\n");
      if (index < 0) break;
      const line = buffer.slice(0, index); buffer = buffer.slice(index + 2);
      if (data) {
        if (line !== ".") { message += line + "\n"; continue; }
        const to = message.match(/^To: (.+)$/im)?.[1]?.trim();
        const code = message.match(/(?:email|password): (\d{6})/)?.[1];
        appendFileSync(outbox, JSON.stringify({ to, code }) + "\n", { mode: 0o600 });
        data = false; message = ""; socket.write("250 queued\r\n"); continue;
      }
      const command = line.split(" ")[0].toUpperCase();
      if (command === "EHLO" || command === "HELO") socket.write("250-localhost\r\n250 AUTH PLAIN\r\n");
      else if (command === "AUTH") socket.write("235 authenticated\r\n");
      else if (command === "DATA") { data = true; socket.write("354 end with dot\r\n"); }
      else if (command === "QUIT") { socket.end("221 bye\r\n"); }
      else socket.write("250 ok\r\n");
    }
  });
}).listen(3188, "127.0.0.1", () => console.log("Test SMTP listening on 127.0.0.1:3188"));
