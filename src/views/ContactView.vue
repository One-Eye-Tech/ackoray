<template>
  <div class="contact-page">
    <!-- Main Content -->
    <section class="contact-section">
      <div class="contact-container">
        
        <div class="header-text">
          <h1 class="title">Get in touch.</h1>
          <p class="subtitle">We'd love to hear from you.</p>
        </div>

        <!-- Contact Card -->
        <div class="contact-card">
          <form @submit.prevent="handleSubmit" class="contact-form">
            <div class="form-group">
              <label for="email" class="form-label">Email Address</label>
              <input 
                type="email" 
                id="email" 
                v-model="formData.email"
                class="form-input" 
                placeholder="name@ackoray.com" 
                required
              >
            </div>
            <div class="form-group">
              <label for="subject" class="form-label">Subject</label>
              <input 
                type="text" 
                id="subject" 
                v-model="formData.subject"
                class="form-input" 
                placeholder="How can we help?" 
                required
              >
            </div>
            <div class="form-group">
              <label for="message" class="form-label">Message</label>
              <textarea 
                id="message" 
                rows="4" 
                v-model="formData.message"
                class="form-textarea" 
                placeholder="Tell us more..." 
                required
              ></textarea>
            </div>
            <button type="submit" class="submit-btn">
              Send Message
            </button>
          </form>
        </div>

        <div class="support-email">
          <p>support@ackoray.com</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const formData = ref({
  email: '',
  subject: '',
  message: ''
})

const handleSubmit = () => {
  console.log('Form submitted:', formData.value)
  // 这里可以添加表单提交逻辑
  alert('Message sent successfully!')
  // 重置表单
  formData.value = {
    email: '',
    subject: '',
    message: ''
  }
}
</script>

<style scoped>
.contact-page {
  background-color: #FAFAFA;
  color: #1D1D1F;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.contact-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
}

.contact-container {
  width: 100%;
  max-width: 512px;
}

.header-text {
  text-align: center;
  margin-bottom: 2.5rem;
}

.title {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
  color: #1D1D1F;
}

.subtitle {
  color: #6b7280;
  font-size: 1rem;
}

.contact-card {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid #f5f5f5;
}

@media (min-width: 768px) {
  .contact-card {
    padding: 2.5rem;
  }
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-input,
.form-textarea {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  color: #111827;
  font-size: 0.875rem;
  border-radius: 12px;
  padding: 0.75rem;
  width: 100%;
  outline: none;
  transition: all 0.3s;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #1D1D1F;
  background: #fff;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #9ca3af;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.submit-btn {
  width: 100%;
  background: #1D1D1F;
  color: white;
  border: none;
  border-radius: 100px;
  padding: 0.75rem 2rem;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.submit-btn:hover {
  background: #2d2d2f;
  transform: translateY(-1px);
}

.submit-btn:active {
  transform: scale(0.95);
}

.support-email {
  text-align: center;
  margin-top: 2rem;
  font-size: 0.875rem;
  color: #9ca3af;
}

</style>
