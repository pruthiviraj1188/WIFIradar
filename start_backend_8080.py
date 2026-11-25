#!/usr/bin/env python3
"""
Start WiFi-Radar Backend Server on Port 8080

Alternative port to avoid conflicts.
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
        "Privacy-Preserving Elderly Safety Monitoring\n"
        "[yellow]Running on PORT 8080[/yellow]",
        border_style="cyan"
    ))
    
    console.print("\n[bold green]Starting server...[/bold green]")
    console.print(f"[dim]Host:[/dim] http://localhost:8080")
    console.print(f"[bold]API Documentation:[/bold] http://localhost:8080/docs")
    console.print(f"[dim]API Root:[/dim] http://localhost:8080/api")
    console.print(f"[dim]Health Check:[/dim] http://localhost:8080/health")
    console.print("\n[yellow]Press CTRL+C to stop[/yellow]\n")
    
    time.sleep(1)
    
    try:
        uvicorn.run(
            "backend.app.main:app",
            host="0.0.0.0",
            port=8080,
            reload=False,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        console.print("\n[yellow]Server stopped by user[/yellow]")
        return 0
    except Exception as e:
        console.print(f"\n[red]✗ Error starting server:[/red]")
        console.print(f"[red]{e}[/red]")
        return 1

if __name__ == "__main__":
    sys.exit(main())
