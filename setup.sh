#!/usr/bin/env bash
# ==============================================================================
# S-Bot Restaurant & Admin Dashboard - All-in-One Docker Deployment Script
# Supports: Ubuntu, Debian, CentOS, AlmaLinux, Rocky Linux, Fedora
# ==============================================================================

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Determine script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "=========================================================="
    echo "       S-Bot Restaurant & Admin Dashboard Setup           "
    echo "               All-in-One Docker Manager                  "
    echo "=========================================================="
    echo -e "${NC}"
}

# Helper to detect compose command
detect_compose() {
    if docker compose version &>/dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &>/dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD=""
    fi
}

# Check and install Docker if missing
install_docker_if_needed() {
    echo -e "${BLUE}[*] Checking Docker installation...${NC}"

    if command -v docker &>/dev/null; then
        echo -e "${GREEN}[✔] Docker is already installed: $(docker --version)${NC}"
    else
        echo -e "${YELLOW}[!] Docker not found. Installing Docker automatically...${NC}"
        
        # Ensure curl is installed
        if ! command -v curl &>/dev/null; then
            echo -e "${BLUE}[*] Installing curl...${NC}"
            if command -v apt-get &>/dev/null; then
                apt-get update -y && apt-get install -y curl
            elif command -v yum &>/dev/null; then
                yum install -y curl
            elif command -v dnf &>/dev/null; then
                dnf install -y curl
            fi
        fi

        # Install Docker via official get.docker.com script
        echo -e "${BLUE}[*] Downloading and running official Docker install script...${NC}"
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm -f get-docker.sh

        # Enable and start Docker service
        if command -v systemctl &>/dev/null; then
            systemctl enable docker
            systemctl start docker
        elif command -v service &>/dev/null; then
            service docker start
        fi

        echo -e "${GREEN}[✔] Docker successfully installed!${NC}"
    fi

    # Check compose
    detect_compose
    if [ -z "$COMPOSE_CMD" ]; then
        echo -e "${YELLOW}[*] Installing Docker Compose plugin...${NC}"
        if command -v apt-get &>/dev/null; then
            apt-get update -y && apt-get install -y docker-compose-plugin
        elif command -v yum &>/dev/null; then
            yum install -y docker-compose-plugin
        elif command -v dnf &>/dev/null; then
            dnf install -y docker-compose-plugin
        fi
        detect_compose
    fi

    if [ -z "$COMPOSE_CMD" ]; then
        echo -e "${RED}[✘] Error: Docker Compose could not be found or installed.${NC}"
        exit 1
    fi
    echo -e "${GREEN}[✔] Compose command ready: $COMPOSE_CMD${NC}"
}

# Prepare environment and volumes
prepare_environment() {
    echo -e "\n${BLUE}[*] Preparing environment and storage directories...${NC}"

    # Ensure .env exists
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            echo -e "${YELLOW}[*] Creating .env from .env.example...${NC}"
            cp .env.example .env
        else
            echo -e "${YELLOW}[*] Creating default .env file...${NC}"
            cat << 'EOF' > .env
TELEGRAM_BOT_TOKEN=8975198229:AAFAv7ilmqbGlvew-ZEHBCNavwm5FSu18gM
ADMIN_TELEGRAM_ID=
STORE_NAME=Pandora Food House
CURRENCY=MMK
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SECRET_KEY=s-bot-restaurant-dashboard-secret-key-change-in-prod
EOF
        fi
        echo -e "${GREEN}[✔] .env file created.${NC}"
    else
        echo -e "${GREEN}[✔] .env file already exists.${NC}"
    fi

    # Ensure persistent directories and files exist on host
    mkdir -p backend/uploads
    touch backend/data.db
    echo -e "${GREEN}[✔] Storage directories and database file initialized.${NC}"
}

# Start the application
start_app() {
    detect_compose
    echo -e "\n${BLUE}[*] Building and starting Docker container...${NC}"
    $COMPOSE_CMD up -d --build

    # Get server IP
    SERVER_IP=$(curl -s -4 https://api.ipify.org || hostname -I | awk '{print $1}')
    
    echo -e "\n${GREEN}${BOLD}==========================================================${NC}"
    echo -e "${GREEN}${BOLD}       🚀 S-Bot Dashboard Successfully Deployed!          ${NC}"
    echo -e "${GREEN}${BOLD}==========================================================${NC}"
    echo -e "${CYAN}Access Dashboard:${NC}  http://${SERVER_IP}:8000"
    echo -e "${CYAN}Default Username:${NC}  admin"
    echo -e "${CYAN}Default Password:${NC}  admin123"
    echo -e "----------------------------------------------------------"
    echo -e "${YELLOW}Useful Management Commands:${NC}"
    echo -e "  bash setup.sh logs     - View real-time logs"
    echo -e "  bash setup.sh restart  - Restart container"
    echo -e "  bash setup.sh stop     - Stop container"
    echo -e "  bash setup.sh update   - Pull latest GitHub code & rebuild"
    echo -e "  bash setup.sh status   - Check container health"
    echo -e "==========================================================\n"
}

# Stop the application
stop_app() {
    detect_compose
    echo -e "${YELLOW}[*] Stopping S-Bot container...${NC}"
    $COMPOSE_CMD down
    echo -e "${GREEN}[✔] S-Bot stopped successfully.${NC}"
}

# Restart the application
restart_app() {
    detect_compose
    echo -e "${BLUE}[*] Restarting S-Bot container...${NC}"
    $COMPOSE_CMD restart
    echo -e "${GREEN}[✔] S-Bot restarted successfully.${NC}"
}

# View application logs
view_logs() {
    detect_compose
    echo -e "${BLUE}[*] Showing live logs (Press Ctrl+C to exit)...${NC}"
    $COMPOSE_CMD logs -f
}

# Update from GitHub
update_app() {
    detect_compose
    echo -e "${BLUE}[*] Pulling latest updates from GitHub repository...${NC}"
    git pull origin master
    echo -e "${BLUE}[*] Rebuilding container with new updates...${NC}"
    $COMPOSE_CMD up -d --build
    echo -e "${GREEN}[✔] Update complete and container restarted!${NC}"
}

# Check container status
status_app() {
    detect_compose
    echo -e "${BLUE}[*] S-Bot Container Status:${NC}"
    $COMPOSE_CMD ps
}

# ==============================================================================
# Main Entry Point
# ==============================================================================
print_banner

ACTION="${1:-all}"

case "$ACTION" in
    all|install|start)
        install_docker_if_needed
        prepare_environment
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        restart_app
        ;;
    logs)
        view_logs
        ;;
    update)
        update_app
        ;;
    status)
        status_app
        ;;
    *)
        echo -e "${RED}Unknown command: $ACTION${NC}"
        echo -e "Usage: bash setup.sh [start|stop|restart|logs|update|status]"
        exit 1
        ;;
esac
