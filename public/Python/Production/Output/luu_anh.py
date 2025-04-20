from openpyxl import load_workbook
import pandas as pd
import matplotlib.pyplot as plt

def export_data_to_image(file_path, sheet_names, output_prefix):
    i=0
    for sheet_name in sheet_names:
        try:
            # Đọc dữ liệu từ sheet
            df = pd.read_excel(file_path, sheet_name=sheet_name)

            # Kiểm tra xem DataFrame có dữ liệu hay không
            if df.empty:
                print(f"Sheet '{sheet_name}' không có dữ liệu, chỉ lưu tiêu đề.")
                headers = df.columns.tolist()
                # Tạo DataFrame rỗng với tiêu đề
                df = pd.DataFrame(columns=headers)
            else:
                headers = df.columns.tolist()

            # Tạo một hình ảnh từ DataFrame
            plt.figure(figsize=(10, 1 + len(df) * 0.5))  # Điều chỉnh kích thước hình ảnh
            plt.axis('tight')
            plt.axis('off')

            # Tạo bảng từ DataFrame
            # Nếu DataFrame rỗng, chỉ vẽ tiêu đề
            if df.empty:
                # Tạo bảng chỉ với tiêu đề
                table = plt.table(cellText=[headers], colLabels=None, cellLoc='center', loc='center')
            else:
                table = plt.table(cellText=df.values, colLabels=headers, cellLoc='center', loc='center')

            # Lưu hình ảnh
            output_file = f"{output_prefix}_{i}.png"
            plt.savefig(output_file, bbox_inches='tight', dpi=300)
            plt.close()  # Đóng hình để giải phóng bộ nhớ
            print(f"Đã lưu dữ liệu từ sheet '{sheet_name}' vào hình ảnh '{output_file}'.")

        except ValueError:
            print(f"Sheet '{sheet_name}' không tồn tại trong file.")
        except Exception as e:
            print(f"Có lỗi xảy ra khi xuất dữ liệu từ sheet '{sheet_name}': {e}")
        i += 1
# Đường dẫn file Excel và thông tin đầu vào
date = '20241021'
file_path = 'C:\\Scan\\Daily_Scan_Report\\2024\\W42\\Daily_report_20241020.xlsx'
bundle_link = 'C:\\Scan\\Daily_Scan_Report\\2024\\W42'

# Danh sách các sheet cần xuất
sheet_names = ["Sum_bundle", "Error Page", "Mix_bundle"]

# Xuất dữ liệu từ các sheet thành hình ảnh
export_data_to_image(file_path, sheet_names, f"{bundle_link}/{date}")