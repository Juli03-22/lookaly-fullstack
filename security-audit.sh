#!/usr/bin/env bash
# =============================================================================
# security-audit.sh — Auditoría de dependencias y código estático
# Ref. 3.6: Revisión de vulnerabilidades conocidas
# =============================================================================
# Uso:
#   chmod +x security-audit.sh
#   ./security-audit.sh
#
# Herramientas:
#   Backend  → pip-audit (CVEs de PyPI) + bandit (análisis estático)
#   Frontend → npm audit (CVEs de npm registry)
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sin color

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║         LOOKALY — Auditoría de Seguridad             ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── 1. pip-audit: vulnerabilidades en dependencias Python ─────────────────────
echo -e "${YELLOW}[1/3] Escaneando dependencias Python con pip-audit...${NC}"
cd backend
pip-audit --strict 2>&1 | tee ../pip-audit-report.json || {
  echo -e "${RED}⚠  pip-audit encontró vulnerabilidades. Revisar pip-audit-report.json${NC}"
}
cd ..

# ── 2. bandit: análisis estático de seguridad en código Python ────────────────
echo ""
echo -e "${YELLOW}[2/3] Analizando código Python con bandit...${NC}"
bandit -r backend/app/ -ll -f txt 2>&1 || {
  echo -e "${RED}⚠  bandit encontró problemas de seguridad (severidad MEDIA o ALTA).${NC}"
}

# ── 3. npm audit: vulnerabilidades en dependencias JavaScript ────────────────
echo ""
echo -e "${YELLOW}[3/3] Escaneando dependencias npm con npm audit...${NC}"
cd frontend
npm audit --audit-level=moderate 2>&1 | tee ../npm-audit.json || {
  echo -e "${RED}⚠  npm audit encontró vulnerabilidades de nivel MODERATE o superior.${NC}"
}
cd ..

echo ""
echo -e "${GREEN}✓ Auditoría completada. Revisa los reportes antes de hacer deploy.${NC}"
echo ""
echo "Próximos pasos si hay vulnerabilidades:"
echo "  Python: pip install --upgrade <paquete>  ó  pip-audit --fix"
echo "  npm:    npm update <paquete>             ó  npm audit fix"
echo ""
