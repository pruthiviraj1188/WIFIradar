#!/usr/bin/env python3
"""
Start WiFi-Radar Backend Server

Simple wrapper to start the backend with better error handling.
"""

import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

def main():
    import uvicorn
    from rich.console import Console
    from rich.panel import Panel
    
    console = Console()
    
    # Check if modules can be imported
    try:
        from backend.app.main import app
        console.print("[green]✓[/green] Backend modules loaded successfully")
    except Exception as e:
        console.print(f"[red]✗[/red] Failed to import backend modules:")
        console.print(f"[red]{e}[/red]")
        return 1
    
    console.print(Panel.fit(
        "[bold cyan]WiFi-Radar Backend Server[/bold cyan]\n"
        "Privacy-Preserving Elderly Safety Monitoring",
        border_style="cyan"
    ))
    
    console.print("\n[bold green]Starting server...[/bold green]")
    console.print(f"[dim]Host:[/dim] http://localhost:8000")
    console.print(f"[dim]API Documentation:[/dim] http://localhost:8000/docs")
    console.print(f"[dim]API Root:[/dim] http://localhost:8000/api")
    console.print(f"[dim]Health Check:[/dim] http://localhost:8000/health")
    console.print("\n[yellow]Press CTRL+C to stop[/yellow]\n")
    
    time.sleep(1)  # Give time to read the message
    
    try:
        uvicorn.run(
            "backend.app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=False,  # Disable reload for stability
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        console.print("\n[yellow]Server stopped by user[/yellow]")
        return 0
    except OSError as e:
        if "Address already in use" in str(e):
            console.print(f"\n[red]✗ Port 8000 is already in use![/red]")
            console.print("[yellow]Try these solutions:[/yellow]")
            console.print("  1. Stop other services using port 8000")
            console.print("  2. Run: lsof -ti :8000 | xargs kill -9")
            console.print("  3. Try a different port in backend/app/main.py")
        else:
            console.print(f"\n[red]✗ Error starting server:[/red]")
            console.print(f"[red]{e}[/red]")
        return 1
    except Exception as e:
        console.print(f"\n[red]✗ Unexpected error:[/red]")
        console.print(f"[red]{e}[/red]")
        return 1

if __name__ == "__main__":
    sys.exit(main())
