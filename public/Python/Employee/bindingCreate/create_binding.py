import sys
sys.stdout.reconfigure(encoding='utf-8')
import numpy as np
import pandas as pd
from sqlalchemy import create_engine , text
import os
from datetime import datetime
from datetime import timedelta

class updateBinding():
    # def __init__(self):
    #    pass
        
    def connectToServer(self):
        try:
            engine = create_engine("mysql+mysqlconnector://i_admin:Hy$2020@10.144.12.93/cutting_system")
            # engine = create_engine("mysql+mysqlconnector://root:123456@10.144.12.93/cutting_system")
        except :
            print(". . . can't connect to server. . .")
            return False
        return engine

    def getDataInput(self,year,week):
        filename = f"\\\\hysfpsv\\planning\\02.PRODUCTION_PLANNING\\17.Binding HYS\\Binding_plan\\{year}\\Binding WK{week}.xlsx"
        if os.path.exists(filename):
            bindingInput = None
            bindingInput = pd.read_excel(filename,sheet_name='WO')
            if len(bindingInput) > 1:
                print(week)
                return bindingInput
            else:
                print('File no data')
                return True
        else:
            return True
        
    def ajustingData(self,bindingInput):
        print
        if type(bindingInput) != bool:
            bindingInput.dropna(subset = ['WO'],inplace = True)
            bindingOutput = pd.DataFrame()
            # print(bindingInput)
            bindingOutput = bindingOutput.dropna()
            bindingOutput['Worklot'] = bindingInput['WO'].astype(str).apply(lambda id:str(int(float(id[:6].replace("+","")))))
            bindingOutput['Worklot'] = bindingOutput['Worklot'].apply(lambda x: pd.to_numeric(x,errors='coerce')).dropna().astype(int)
            bindingOutput['Worklot'] = bindingOutput['Worklot'].astype(str)
            bindingOutput['Worklot'] = ('BI'+bindingOutput['Worklot'].astype(str).apply(lambda id:("000"+id)[-6:])).astype(str)
            bindingOutput['Binding_Code'] = bindingInput['Mã Binding']
            bindingOutput['Style'] = bindingInput['Mã Binding'].astype(str).apply(lambda id:id[0:6])
            bindingOutput['Color'] = bindingInput['Màu']
            bindingOutput['Size'] = bindingInput['Mã Binding'].astype(str).apply(lambda id:id[15:17])
            bindingOutput['Fabric'] = bindingInput['Vải sử dụng']
            bindingOutput['Quantity'] = bindingInput['Tổng binding cắt'].dropna().round(0).astype(int)
            # bindingOutput = bindingOutput.dropna()
            bindingOutput['Up_Load_Date'] = str(datetime.now().strftime("%y%m%d%H%M%S"))
            print(bindingOutput)
            return bindingOutput
        else:
            return False
        
    def insertToServer(self,bindingUpdate,cnx):
        # if type(bindingUpdate) != bool:
        #     for i in range(0,len(bindingUpdate)):
        #         query = f'''INSERT INTO wl_binding (Worklot,Binding_Code,Style,Color,Size,Fabric,Quantity,Up_Load_Date)
        #                    VALUES ('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s') 
        #                    ON DUPLICATE KEY UPDATE 
        #                    Worklot = '{bindingUpdate.iloc[i]['Worklot']}',
        #                    Binding_Code = '{bindingUpdate.iloc[i]['Binding_Code']}',
        #                    Color = '{bindingUpdate.iloc[i]['Color']}',
        #                    Style = '{bindingUpdate.iloc[i]['Style']}',
        #                    Size = '{bindingUpdate.iloc[i]['Size']}',
        #                    Fabric = '{bindingUpdate.iloc[i]['Fabric']}',
        #                    Quantity = {bindingUpdate.iloc[i]['Quantity']},
        #                    Up_Load_Date = {bindingUpdate.iloc[i]['Up_Load_Date']};''' % (bindingUpdate.iloc[i]['Worklot'],
        #                                                                                  bindingUpdate.iloc[i]['Binding_Code'],
        #                                                                                  bindingUpdate.iloc[i]['Style'],
        #                                                                                  bindingUpdate.iloc[i]['Color'],
        #                                                                                  bindingUpdate.iloc[i]['Size'],
        #                                                                                  bindingUpdate.iloc[i]['Fabric'],
        #                                                                                  bindingUpdate.iloc[i]['Quantity'],
        #                                                                                  bindingUpdate.iloc[i]['Up_Load_Date'])
        #         cnx.execute(query)
        #         cnx.dispose()
        #     print("*** Update successfully ***")
        # else:
        #     return False            
            if isinstance(bindingUpdate, pd.DataFrame) and not bindingUpdate.empty:
                query = text('''
                    INSERT INTO wl_binding (
                        Worklot, Binding_Code, Style, Color, Size, Fabric, Quantity, Up_Load_Date
                    ) VALUES (
                        :worklot, :binding_code, :style, :color, :size, :fabric, :quantity, :up_load_date
                    ) ON DUPLICATE KEY UPDATE 
                        Worklot = VALUES(Worklot),
                        Binding_Code = VALUES(Binding_Code),
                        Style = VALUES(Style),
                        Color = VALUES(Color),
                        Size = VALUES(Size),
                        Fabric = VALUES(Fabric),
                        Quantity = VALUES(Quantity),
                        Up_Load_Date = VALUES(Up_Load_Date);
                ''')
                
                with cnx.begin() as connection:
                    for _, row in bindingUpdate.iterrows():
                        connection.execute(query, {
                            'worklot': row['Worklot'],
                            'binding_code': row['Binding_Code'],
                            'style': row['Style'],
                            'color': row['Color'],
                            'size': row['Size'],
                            'fabric': row['Fabric'],
                            'quantity': row['Quantity'],
                            'up_load_date': row['Up_Load_Date']
                        })

                print("*** Update successfully ***")
            else:
                print("No valid data to insert.")
                return False

          
    def deleteBinding(self,cnx,bindingDelete):
        # try:
        #     delete = pd.DataFrame()
        #     bindingDelete = bindingDelete[bindingDelete['WO'].str.contains('N',na=False)]
        #     delete['WO'] = 'BI'+bindingDelete['WO'].astype(str).apply(lambda id:id[1:7])
        #     print(delete)
        #     for i in range(0,len(delete['WO'])):
        #         query = f'''DELETE FROM wl_binding WHERE `Worklot` = '{delete.iloc[i]['WO']}';'''
        #         print("xoa du lieu: ",query)
        #         cnx.execute(query)
        #         cnx.dispose()
        #     print("*** Delete done ***")     
        # except:
        #     return False   
        try:
            # Lọc các bản ghi cần xóa
            bindingDelete = bindingDelete[bindingDelete['WO'].str.contains('N', na=False)]
            delete_list = 'BI' + bindingDelete['WO'].str[1:7]  # Tạo danh sách Worklot

            if not delete_list.empty:
                print("Danh sách cần xóa:", delete_list.tolist())

                # Tạo câu lệnh DELETE với nhiều điều kiện
                query = text('''
                    DELETE FROM wl_binding 
                    WHERE Worklot IN :worklots;
                ''')

                # Sử dụng `with` để quản lý kết nối
                with cnx.begin() as connection:
                    connection.execute(query, {'worklots': tuple(delete_list)})

                print("*** Delete done ***")
            else:
                print("Không có dữ liệu để xóa.")
        except Exception as e:
            print("Lỗi:", e)
            return False
                     
uB = updateBinding()
if __name__=="__main__":
    week_num = str(datetime.now().strftime("%W"))
    year = str(datetime.now().strftime('%Y'))
    uB.insertToServer(uB.ajustingData(uB.getDataInput(year,week_num)),uB.connectToServer())
    uB.deleteBinding(uB.connectToServer(),uB.getDataInput(year,week_num))
    week_num = str((datetime.now() + timedelta(days=7)).strftime("%W"))
    year = str((datetime.now() + timedelta(days=7)).strftime('%Y'))
    uB.insertToServer(uB.ajustingData(uB.getDataInput(year,week_num)),uB.connectToServer())
    uB.deleteBinding(uB.connectToServer(),uB.getDataInput(year,week_num))
        