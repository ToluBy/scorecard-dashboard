import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-excel-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <!-- Hidden file input -->
      <input
        type="file"
        class="hidden"
        #fileInput
        (change)="onFileChange($event)"
        accept=".xlsx, .xls"
      >
      
      <!-- Upload button -->
      <button
        (click)="fileInput.click()"
        class="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center space-x-2"
        [class.opacity-50]="isLoading"
        [disabled]="isLoading"
      >
        <i class="fas" [class.fa-spinner]="isLoading" [class.fa-spin]="isLoading" [class.fa-file-excel]="!isLoading"></i>
        <span>{{ isLoading ? 'Loading...' : 'Load Assessment File' }}</span>
      </button>

      <!-- Error Message -->
      @if (errorMessage) {
        <div class="absolute top-full left-0 right-0 mt-2">
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative" role="alert">
            <strong class="font-bold">Error!</strong>
            <span class="block sm:inline"> {{ errorMessage }}</span>
            <button class="absolute top-0 bottom-0 right-0 px-4" (click)="clearError()">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      }

      <!-- Success Message -->
      @if (showSuccess) {
        <div class="absolute top-full left-0 right-0 mt-2">
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded relative" role="alert">
            <strong class="font-bold">Success!</strong>
            <span class="block sm:inline"> Data loaded successfully.</span>
            <button class="absolute top-0 bottom-0 right-0 px-4" (click)="clearSuccess()">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExcelUploadComponent {
  @Output() dataLoaded = new EventEmitter<any[]>();
  @Output() error = new EventEmitter<string>();
  @Output() loading = new EventEmitter<boolean>();

  isLoading = false;
  errorMessage = '';
  showSuccess = false;

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      this.setError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    this.startLoading();

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        console.log('Reading Excel file...');
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        
        console.log('Available sheets:', workbook.SheetNames);
        
        if (!workbook.SheetNames?.length) {
          throw new Error('Excel file does not contain any sheets');
        }

        // Get the first sheet by default
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          dateNF: 'yyyy-mm-dd'
        });

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          throw new Error('The Excel file is empty or missing data rows');
        }

        console.log('Processed data:', jsonData);
        this.dataLoaded.emit(jsonData);
        this.showSuccess = true;
        
      } catch (error: any) {
        console.error('Error processing Excel file:', error);
        this.setError(error.message || 'Error processing the Excel file. Please check the format and try again.');
      } finally {
        this.stopLoading();
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      this.setError('Error reading the file. Please try again.');
      this.stopLoading();
    };

    reader.readAsBinaryString(file);
  }

  private startLoading() {
    this.isLoading = true;
    this.errorMessage = '';
    this.showSuccess = false;
    this.loading.emit(true);
  }

  private stopLoading() {
    this.isLoading = false;
    this.loading.emit(false);
  }

  private setError(message: string) {
    this.errorMessage = message;
    this.error.emit(message);
  }

  clearError() {
    this.errorMessage = '';
  }

  clearSuccess() {
    this.showSuccess = false;
  }
} 