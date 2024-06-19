document.addEventListener("DOMContentLoaded", async () => {
  let downloadLink;
  let frameRate;
  const player = new Plyr('#player');
  const pageTitle = document.getElementById("title");

  // Socket.io initialization
  const socket = io();

  // Review session information
  const reviewName = localStorage.getItem("reviewName");
  const reviewPassword = localStorage.getItem("reviewPassword");
  const username = localStorage.getItem("username");

  if (!reviewName || !reviewPassword || !username) {
      alert("Review name, password, or username missing");
      window.location.href = "/";
      return;
  }

  const videoId = await fetchVideoUrl(reviewName, reviewPassword);
  pageTitle.innerText = reviewName;

  const commentForm = document.getElementById("comment-form");
  const commentTextInput = document.getElementById("comment-text");
  const exportEdlButton = document.getElementById("export-edl");

  const commentsData = await fetchComments(videoId);

  setupEventListeners();

  async function fetchVideoUrl(reviewName, reviewPassword) {
      const response = await fetch("/reviews/get", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ reviewName, reviewPassword }),
      });

      if (response.ok) {
          const data = await response.json();
          const videoUrl = data.videoUrl;
          const videoFilename = videoUrl.replace(/\.[^/.]+$/, "");
          const getVideo = "./videos/" + videoUrl;
          downloadLink = "./videos/" + videoFilename;
          frameRate = data.frameRate;
          changeVideoSource(getVideo);
          return data.videoId;
      } else {
          alert("Invalid review name or password");
          window.location.href = "/";
      }
  }

  async function fetchComments(videoId) {
      const response = await fetch(`/comments/${videoId}`);
      const comments = await response.json();
      comments.sort((a, b) => a.timestamp - b.timestamp);
      renderComments(comments);
      return comments;
  }

  async function changeVideoSource(url) {
      player.source = {
          type: "video",
          sources: [
              {
                  src: url,
                  type: "video/mp4",
              },
          ],
      };
  }

  function renderComments(comments) {
      const commentsContainer = document.getElementById("commentsContainer");
      commentsContainer.innerHTML = comments.map(comment => `
          <div class="comment">
              <div class="text-container">
                  <div data-id="${comment.id}" data-timestamp="${comment.timestamp}">
                      <div>${formatTime(comment.timestamp)} <strong>${comment.username}</strong>: <span class="comment-text">${comment.text}</span></div>
                  </div>
              </div>
              <div class="isDoneText">COMPLETED:</div>
              <div class="isDoneBox">
                  <input id="${comment.id}" class="comment-checkbox" type="checkbox" ${comment.isDone ? "checked" : ""}>
              </div>
              <div class="colorText">FLAG:</div>
              <div class="color-flag" style="background-color: ${getColorHex(comment.colorName)};"></div>
              <div class="button-container">
                  <button class="edit-comment" data-id="${comment.id}">Edit</button>
                  <button class="delete-comment" data-id="${comment.id}">Delete</button>
              </div>
          </div>
      `).join("");

      document.querySelectorAll(".comment-checkbox").forEach(checkbox => {
          checkbox.addEventListener("click", handleCheckboxClick);
      });
  }

  async function handleCheckboxClick(event) {
      const checkbox = event.target;
      const commentId = checkbox.id;
      const isChecked = checkbox.checked;

      const response = await fetch(`/comments/${commentId}/isDone`, {
          method: "PUT",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ isDone: isChecked ? 1 : 0 }),
      });

      if (!response.ok) {
          alert("Error updating comment");
      }
  }

  function setupEventListeners() {
      document.addEventListener("click", handleDocumentClick);
      commentTextInput.addEventListener("focus", () => player.pause());
      commentForm.addEventListener("submit", handleCommentSubmit);
      exportEdlButton.addEventListener("click", () => exportCommentsAsEdl(commentsData));

      const helpBtn = document.getElementById("helpBtn");
      const helpModal = document.getElementById("helpModal");
      const closeBtn = document.querySelector(".close");

      helpBtn.addEventListener("click", () => helpModal.style.display = "block");
      closeBtn.addEventListener("click", () => helpModal.style.display = "none");
      window.addEventListener("click", (event) => {
          if (event.target == helpModal) {
              helpModal.style.display = "none";
          }
      });

      document.addEventListener("keydown", handleKeydown);
      document.getElementById("downloadBtn").addEventListener("click", handleDownload);
  }

  function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  }

  function getColorHex(colorName) {
      const colorMap = {
          blue: "#4cb7e3",
          cyan: "#E0FFFF",
          green: "#6AA84F",
          pink: "#c90076",
          red: "#FF0000",
          yellow: "#ffd966",
      };
      return colorMap[colorName.toLowerCase()] || "#000000";
  }

  async function handleCommentSubmit(event) {
      event.preventDefault();

      const timestamp = player.currentTime;
      const dropdown = document.getElementById("tag-color");
      const selectedOption = dropdown.value;
      const colorObject = JSON.parse(selectedOption);
      const colorName = colorObject.colorCode;
      const isDone = 0;
      const text = commentTextInput.value.trim();

      if (!text) {
          console.error("Comment text is empty.");
          player.pause();
          return;
      }

      const payload = {
          videoId,
          text,
          timestamp,
          username,
          colorName,
          isDone,
      };

      const response = await fetch("/comments", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
      });

      if (response.ok) {
          const newComment = await response.json();
          commentTextInput.value = "";
          commentsData.push(newComment);
          commentsData.sort((a, b) => a.timestamp - b.timestamp);
          renderComments(commentsData);
          player.play();
      } else {
          alert("Error adding comment");
      }
  }

  async function handleDocumentClick(event) {
      if (event.target.closest("[data-timestamp]")) {
          const timestamp = event.target.closest("[data-timestamp]").dataset.timestamp;
          player.currentTime = parseFloat(timestamp);
      } else if (event.target.classList.contains("edit-comment")) {
          const commentId = event.target.dataset.id;
          handleEditComment(commentId);
      } else if (event.target.classList.contains("delete-comment")) {
          const commentId = event.target.dataset.id;
          handleDeleteComment(commentId);
      }
  }

  async function handleEditComment(commentId) {
      const commentDiv = document.querySelector(`[data-id="${commentId}"]`);
      const commentTextElement = commentDiv.querySelector(".comment-text");

      const commentText = prompt("Edit your comment:", commentTextElement.textContent.trim());

      if (commentText) {
          const response = await fetch(`/comments/${commentId}`, {
              method: "PUT",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({ text: commentText }),
          });

          if (response.ok) {
              const updatedComment = await response.json();
              commentTextElement.textContent = updatedComment.text;
          } else {
              alert("Error updating comment");
          }
      }
  }

  async function handleDeleteComment(commentId) {
      const commentDiv = document.querySelector(`[data-id="${commentId}"]`);
      const commentContainer = commentDiv.closest(".comment");

      if (confirm("Are you sure you want to delete this comment?")) {
          const response = await fetch(`/comments/${commentId}`, {
              method: "DELETE",
          });

          if (response.ok) {
              commentsData = commentsData.filter(comment => comment.id !== commentId);
              commentContainer.remove();
          } else {
              alert("Error deleting comment");
          }
      }
  }

  function handleDownload() {
      const a = document.createElement('a');
      a.href = downloadLink;
      a.download = downloadLink.split('/').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  }

  function exportCommentsAsEdl(comments) {
      const edlHeader = `TITLE: ${reviewName}\n\n`;
      let edlBody = "";
      comments.forEach((comment, index) => {
          const resolveColorF = resolveColor(comment.colorName);
          const timecode = convertToTimecode(comment.timestamp, frameRate);
          const clipNumber = String(index + 1).padStart(3, "0");
          edlBody += `${clipNumber}  001      V     C        ${timecode} ${timecode} ${timecode} ${timecode}\n|C:${resolveColorF} |M:${comment.username} - ${comment.text}\n`;
      });

      const edlContent = edlHeader + edlBody;

      const encodedUri = encodeURI(`data:text/plain;charset=utf-8,${edlContent}`);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${reviewName}.edl`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  function resolveColor(color) {
      const colorMapping = {
          Blue: "ResolveColorBlue",
          Cyan: "ResolveColorCyan",
          Green: "ResolveColorGreen",
          Pink: "ResolveColorPink",
          Red: "ResolveColorRed",
          Yellow: "ResolveColorYellow",
      };
      return colorMapping[color] || "ResolveColorBlue";
  }

  function convertToTimecode(seconds, framerate) {
      const frames = Math.floor((seconds % 1) * framerate);
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}:${secs < 10 ? "0" : ""}${secs}:${frames < 10 ? "0" : ""}${frames}`;
  }

  function handleKeydown(event) {
      const activeElement = document.activeElement;
      const isInputFocused = activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA";

      if (!isInputFocused) {
          switch (event.key) {
              case " ":
                  event.preventDefault();
                  player.togglePlay();
                  break;
              case "j":
                  event.preventDefault();
                  player.rewind(2);
                  break;
              case "k":
                  event.preventDefault();
                  player.togglePlay();
                  break;
              case "l":
                  event.preventDefault();
                  player.forward(2);
                  break;
              default:
                  break;
          }
      }
  }

  createColorOptions();

  async function createColorOptions() {
      const dropdown = document.getElementById("tag-color");
      const colorOptions = await getColors();

      colorOptions.forEach(optionData => {
          const option = document.createElement("option");
          option.value = JSON.stringify({
              resolveColor: optionData.resolveColor,
              colorCode: optionData.name,
          });
          option.text = optionData.name;
          dropdown.appendChild(option);
      });
  }

  async function getColors() {
      const response = await fetch(`/extraRoutes/colors`);
      return await response.json();
  }
});
