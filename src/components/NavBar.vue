<template>
  <nav class="navbar">
    <div class="nav-container">
      <!-- Logo -->
      <a href="#" class="logo" @click.prevent="goToHome">Ackoray.</a>
      
      <!-- Navigation Menu -->
      <div class="nav-menu">
        <ul class="nav-links">
          <li><a href="#" class="nav-link" :class="{ active: currentPage === 'home' }" @click.prevent="goToHome">Home</a></li>
          <li><a href="#" class="nav-link" @click.prevent>Features</a></li>
          <li><a href="#" class="nav-link" @click.prevent>Pricing</a></li>
          <li><a href="#" class="nav-link" :class="{ active: currentPage === 'contact' }" @click.prevent="goToContact">Contact</a></li>
        </ul>
      </div>
      
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'

const currentPage = ref('home')
const emit = defineEmits(['navigate'])

const goToHome = () => {
  currentPage.value = 'home'
  emit('navigate', 'home')
}

const goToContact = () => {
  currentPage.value = 'contact'
  emit('navigate', 'contact')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.navbar {
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid #f3f4f6;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
}

.logo {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1D1D1F;
  text-decoration: none;
  letter-spacing: -0.01em;
  transition: opacity 0.3s;
}

.logo:hover {
  opacity: 0.7;
}

.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  font-size: 0.95rem;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  transition: color 0.3s;
  cursor: pointer;
}

.nav-link:hover {
  color: #1D1D1F;
}

.nav-link.active {
  color: #1D1D1F;
}

/* Responsive */
@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }
  
  .nav-container {
    padding: 1rem;
  }
}
</style>
