"""
Run WiFi-Radar Backend Server

Phase 5: Backend API Server
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

if __name__ == "__main__":
    import uvicorn
    from rich.console import Console
    from rich.panel import Panel
    
    console = Console()
    
    console.print(Panel.fit(
        "[bold cyan]WiFi-Radar Backend Server[/bold cyan]\n"
        "Phase 5: REST API & Database",
        border_style="cyan"
    ))
    
    console.print("\n[bold]Starting server...[/bold]")
    console.print("API Documentation: http://localhost:8000/docs")
    console.print("API Root: http://localhost:8000/api")
    console.print("\nPress CTRL+C to stop\n")
    
    try:
        uvicorn.run(
            "backend.app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        console.print("\n[yellow]Server stopped[/yellow]")
