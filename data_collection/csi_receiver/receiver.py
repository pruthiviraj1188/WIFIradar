"""
CSI Receiver

Receives CSI data from ESP32 via serial connection.
"""

import serial
import serial.tools.list_ports
import time
import queue
import threading
from typing import Optional, Callable, List
from pathlib import Path
from datetime import datetime
import json

try:
    from .parser import CSIParser
except ImportError:
    from parser import CSIParser

from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.table import Table

console = Console()


class CSIReceiver:
    """Receive and process CSI data from ESP32."""
    
    def __init__(
        self,
        port: Optional[str] = None,
        baud_rate: int = 115200,
        buffer_size: int = 1000
    ):
        """
        Initialize CSI receiver.
        
        Args:
            port: Serial port (e.g., '/dev/ttyUSB0'). Auto-detect if None.
            baud_rate: Serial baud rate
            buffer_size: Maximum buffer size for CSI packets
        """
        self.port = port
        self.baud_rate = baud_rate
        self.buffer_size = buffer_size
        
        self.serial_conn = None
        self.parser = CSIParser()
        self.packet_queue = queue.Queue(maxsize=buffer_size)
        
        self.is_running = False
        self.receive_thread = None
        
        self.callbacks = []
        
    def list_available_ports(self) -> List[str]:
        """
        List available serial ports.
        
        Returns:
            List of port names
        """
        ports = serial.tools.list_ports.comports()
        return [port.device for port in ports]
    
    def auto_detect_port(self) -> Optional[str]:
        """
        Auto-detect ESP32 serial port.
        
        Returns:
            Port name or None if not found
        """
        ports = serial.tools.list_ports.comports()
        
        # Look for common ESP32 identifiers
        esp32_keywords = ['CP210', 'CH340', 'USB', 'UART', 'ESP32']
        
        for port in ports:
            port_info = f"{port.device} {port.description} {port.manufacturer or ''}".upper()
            
            for keyword in esp32_keywords:
                if keyword in port_info:
                    return port.device
        
        # Return first available port as fallback
        if len(ports) > 0:
            return ports[0].device
        
        return None
    
    def connect(self) -> bool:
        """
        Connect to ESP32 via serial.
        
        Returns:
            True if connected successfully
        """
        if self.serial_conn and self.serial_conn.is_open:
            console.print("[yellow]Already connected[/yellow]")
            return True
        
        # Auto-detect port if not specified
        if self.port is None:
            self.port = self.auto_detect_port()
            
            if self.port is None:
                console.print("[red]No serial ports detected[/red]")
                console.print("Available ports:", self.list_available_ports())
                return False
            
            console.print(f"[cyan]Auto-detected port: {self.port}[/cyan]")
        
        try:
            self.serial_conn = serial.Serial(
                port=self.port,
                baudrate=self.baud_rate,
                timeout=1.0
            )
            
            # Wait for connection to stabilize
            time.sleep(2)
            
            console.print(f"[green]✓ Connected to {self.port} @ {self.baud_rate} baud[/green]")
            return True
            
        except serial.SerialException as e:
            console.print(f"[red]✗ Failed to connect: {e}[/red]")
            return False
    
    def disconnect(self):
        """Disconnect from ESP32."""
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close()
            console.print("[yellow]Disconnected[/yellow]")
    
    def _receive_loop(self):
        """Background thread for receiving CSI data."""
        while self.is_running:
            try:
                if self.serial_conn and self.serial_conn.is_open:
                    if self.serial_conn.in_waiting > 0:
                        line = self.serial_conn.readline().decode('utf-8', errors='ignore')
                        
                        # Parse CSI data
                        packet = self.parser.parse_line(line)
                        
                        if packet is not None:
                            # Add to queue
                            try:
                                self.packet_queue.put_nowait(packet)
                            except queue.Full:
                                # Remove oldest packet if buffer is full
                                try:
                                    self.packet_queue.get_nowait()
                                    self.packet_queue.put_nowait(packet)
                                except:
                                    pass
                            
                            # Call callbacks
                            for callback in self.callbacks:
                                try:
                                    callback(packet)
                                except Exception as e:
                                    console.print(f"[red]Callback error: {e}[/red]")
                
                time.sleep(0.001)  # Small delay to prevent CPU overload
                
            except Exception as e:
                console.print(f"[red]Receive error: {e}[/red]")
                time.sleep(1)
    
    def start_receiving(self) -> bool:
        """
        Start receiving CSI data in background thread.
        
        Returns:
            True if started successfully
        """
        if self.is_running:
            console.print("[yellow]Already receiving[/yellow]")
            return True
        
        if not self.serial_conn or not self.serial_conn.is_open:
            console.print("[red]Not connected. Call connect() first.[/red]")
            return False
        
        self.is_running = True
        self.receive_thread = threading.Thread(target=self._receive_loop, daemon=True)
        self.receive_thread.start()
        
        console.print("[green]✓ Started receiving CSI data[/green]")
        return True
    
    def stop_receiving(self):
        """Stop receiving CSI data."""
        if self.is_running:
            self.is_running = False
            if self.receive_thread:
                self.receive_thread.join(timeout=2.0)
            console.print("[yellow]Stopped receiving[/yellow]")
    
    def get_packet(self, timeout: float = 1.0) -> Optional[dict]:
        """
        Get next CSI packet from queue.
        
        Args:
            timeout: Maximum time to wait for packet
            
        Returns:
            CSI packet dictionary or None if timeout
        """
        try:
            return self.packet_queue.get(timeout=timeout)
        except queue.Empty:
            return None
    
    def get_packet_buffer(self, max_packets: int = 100) -> List[dict]:
        """
        Get multiple packets from buffer.
        
        Args:
            max_packets: Maximum number of packets to retrieve
            
        Returns:
            List of CSI packets
        """
        packets = []
        
        for _ in range(max_packets):
            try:
                packet = self.packet_queue.get_nowait()
                packets.append(packet)
            except queue.Empty:
                break
        
        return packets
    
    def register_callback(self, callback: Callable):
        """
        Register callback function for received packets.
        
        Args:
            callback: Function that takes packet dict as argument
        """
        self.callbacks.append(callback)
    
    def get_statistics(self) -> dict:
        """
        Get receiver statistics.
        
        Returns:
            Dictionary with statistics
        """
        parser_stats = self.parser.get_statistics()
        
        return {
            'connected': self.serial_conn.is_open if self.serial_conn else False,
            'is_receiving': self.is_running,
            'port': self.port,
            'baud_rate': self.baud_rate,
            'buffer_size': self.packet_queue.qsize(),
            'max_buffer_size': self.buffer_size,
            **parser_stats
        }


def demo_receiver():
    """Demonstration of CSI receiver."""
    console.print(Panel.fit(
        "[bold cyan]WiFi-Radar CSI Receiver Demo[/bold cyan]\n"
        "[dim]Simulates receiving CSI data from ESP32[/dim]",
        border_style="cyan"
    ))
    
    # Note: This is a simulation since we don't have actual hardware
    console.print("\n[yellow]⚠ Hardware Simulation Mode[/yellow]")
    console.print("[dim]Real ESP32 hardware is required for actual CSI capture[/dim]\n")
    
    receiver = CSIReceiver()
    
    console.print("[bold]Available Serial Ports:[/bold]")
    ports = receiver.list_available_ports()
    
    if len(ports) == 0:
        console.print("  [red]No serial ports detected[/red]")
    else:
        for port in ports:
            console.print(f"  • {port}")
    
    console.print("\n[bold]Receiver Configuration:[/bold]")
    console.print(f"  Baud Rate: {receiver.baud_rate}")
    console.print(f"  Buffer Size: {receiver.buffer_size}")
    
    console.print("\n[bold cyan]Phase 4 CSI Receiver Ready![/bold cyan]")
    console.print("\n[bold]To use with real ESP32:[/bold]")
    console.print("  1. Flash ESP32 firmware (see hardware/esp32_firmware/README.md)")
    console.print("  2. Connect ESP32 via USB")
    console.print("  3. Run: python data_collection/csi_receiver/receiver.py")
    console.print("  4. CSI data will stream in real-time")
    
    console.print("\n[green]✓ Phase 4 receiver implementation complete![/green]")


if __name__ == "__main__":
    demo_receiver()
