"""
CSI Data Parser

Parses raw CSI data received from ESP32.
"""

import numpy as np
from typing import Dict, Optional, List
from datetime import datetime
import json


class CSIParser:
    """Parse CSI data from ESP32 format."""
    
    def __init__(self):
        """Initialize CSI parser."""
        self.packet_count = 0
        self.error_count = 0
        
    def parse_line(self, line: str) -> Optional[Dict]:
        """
        Parse a single line of CSI data.
        
        Expected format:
        CSI_DATA,timestamp,mac,rssi,rate,sig_mode,mcs,cwb,len,data
        
        Args:
            line: Raw data line from ESP32
            
        Returns:
            Dictionary with parsed data or None if parsing fails
        """
        try:
            line = line.strip()
            
            if not line.startswith('CSI_DATA'):
                return None
            
            parts = line.split(',')
            
            if len(parts) < 10:
                self.error_count += 1
                return None
            
            # Parse metadata
            metadata = {
                'type': parts[0],
                'timestamp': int(parts[1]),
                'mac_address': parts[2],
                'rssi': int(parts[3]),
                'rate': int(parts[4]),
                'sig_mode': int(parts[5]),
                'mcs': int(parts[6]),
                'cwb': int(parts[7]),
                'len': int(parts[8]),
            }
            
            # Parse CSI data
            csi_data_str = ','.join(parts[9:])
            csi_data = np.array([float(x) for x in csi_data_str.split(',')], dtype=np.float32)
            
            metadata['csi_data'] = csi_data
            metadata['received_at'] = datetime.now().isoformat()
            metadata['packet_id'] = self.packet_count
            
            self.packet_count += 1
            
            return metadata
            
        except Exception as e:
            self.error_count += 1
            return None
    
    def parse_buffer(self, lines: List[str]) -> List[Dict]:
        """
        Parse multiple lines of CSI data.
        
        Args:
            lines: List of raw data lines
            
        Returns:
            List of parsed CSI packets
        """
        packets = []
        
        for line in lines:
            parsed = self.parse_line(line)
            if parsed is not None:
                packets.append(parsed)
        
        return packets
    
    def get_statistics(self) -> Dict:
        """
        Get parsing statistics.
        
        Returns:
            Dictionary with statistics
        """
        return {
            'total_packets': self.packet_count,
            'error_count': self.error_count,
            'success_rate': (self.packet_count / (self.packet_count + self.error_count)) 
                           if (self.packet_count + self.error_count) > 0 else 0.0
        }
    
    def reset_statistics(self):
        """Reset packet and error counters."""
        self.packet_count = 0
        self.error_count = 0


if __name__ == "__main__":
    # Test parser
    from rich.console import Console
    
    console = Console()
    console.print("[bold cyan]Testing CSI Parser[/bold cyan]\n")
    
    # Create sample CSI data
    sample_lines = [
        "CSI_DATA,12345,aa:bb:cc:dd:ee:ff,-45,11,0,0,0,10,1.2,3.4,5.6,7.8,9.0,10.1,11.2,12.3,13.4,14.5",
        "CSI_DATA,12350,aa:bb:cc:dd:ee:ff,-43,11,0,0,0,10,2.1,4.2,6.3,8.4,10.5,12.6,14.7,16.8,18.9,20.0",
        "INVALID_LINE,12355",
        "CSI_DATA,12360,aa:bb:cc:dd:ee:ff,-44,11,0,0,0,10,3.0,6.0,9.0,12.0,15.0,18.0,21.0,24.0,27.0,30.0",
    ]
    
    parser = CSIParser()
    
    console.print(f"Parsing {len(sample_lines)} lines...")
    packets = parser.parse_buffer(sample_lines)
    
    console.print(f"\n[green]✓ Parsed {len(packets)} packets[/green]")
    
    for i, packet in enumerate(packets):
        console.print(f"\nPacket {i+1}:")
        console.print(f"  Timestamp: {packet['timestamp']}")
        console.print(f"  MAC: {packet['mac_address']}")
        console.print(f"  RSSI: {packet['rssi']} dBm")
        console.print(f"  CSI Length: {len(packet['csi_data'])}")
        console.print(f"  CSI Data: {packet['csi_data'][:5]}... (showing first 5 values)")
    
    stats = parser.get_statistics()
    console.print(f"\n[bold]Statistics:[/bold]")
    console.print(f"  Total packets: {stats['total_packets']}")
    console.print(f"  Errors: {stats['error_count']}")
    console.print(f"  Success rate: {stats['success_rate']:.1%}")
    
    console.print("\n[green]✓ All tests passed![/green]")
