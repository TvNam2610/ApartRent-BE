import sys, json
import mysql.connector, mysql
import pandas as pd
from sqlalchemy import create_engine
import numpy as np

hostname='pbvweb01v'
engine = create_engine('mysql+mysqlconnector://root:123456@pbvweb01v:3306/linebalancing', echo=False)
engineNam = create_engine('mysql+mysqlconnector://root:123456@pbvweb01v:3306/erpsystem', echo=False)

group=""
wc=""
shift=""
week=""

def __get_formal_operation(operation):
    check=pd.read_sql('select distinct New_Operation from setup_operation_convert where Old_Operation="'+operation+'"', engine)
    if len(check)>0:
        return check.iloc[0,0]
    else:
        return operation

def __get_operation_efficiency_from_fabric_size(ID):#get Operation1, Efficiency1, Operation2, Efficiency2 from ID, Fabric, Size
    operation=pd.read_sql('select Operation1, Efficiency1, Operation2, Efficiency2, Note1, Note2 from setup_employee_operation where ID="'+ID+'" and Fabric="'+wc+'"', engine)
    if len(operation)==0:
        return "",'0',"",'0', "", ""#return 0 if history not existed
    else:
        operation1 =__get_formal_operation(operation.iloc[0,0])
        efficiency1=int(operation.iloc[0,1])
        operation2 =__get_formal_operation(operation.iloc[0,2])
        efficiency2=int(operation.iloc[0,3])
        note1      =str(operation.iloc[0,4])
        if note1=='None':
            note1=''
        note2      =str(operation.iloc[0,5])
        return operation1, efficiency1, operation2, efficiency2, note1, note2

def get_employee_data():#1        
    fromLine = int(group[0:3])
    toLine   = int(group[4:7])
    __ID=[]
    __Name=[]
    __Shift=[]
    __Line=[]
    __Operation1=[]
    __Efficiency1=[]
    __Operation2=[]
    __Efficiency2=[]
    __note1=[]
    __note2=[]
    for line in range(fromLine, toLine+1):
        line_str=str(line)
        if len(line_str)==1:
            line_str='00'+line_str
        elif len(line_str)==2:
            line_str='0'+line_str
        #normal employees
        id_names=pd.read_sql('select ID, Name, Line, Shift from setup_employee_list where Line="Line '+line_str+'" and Shift like "'+shift+'%" and Active="1" and Week="'+week+'";', engine)
        for row in range(0, len(id_names)):
            employee_id    = id_names.iloc[row,0]
            employee_name  = id_names.iloc[row,1]
            employee_line  = id_names.iloc[row,2]
            if 'MAT' in id_names.iloc[row,3]:
                employee_shift = 'MAT'
            else:
                employee_shift = shift
            employee_operation1, employee_efficiency1, employee_operation2, employee_efficiency2, note1, note2=__get_operation_efficiency_from_fabric_size(employee_id)
            __ID.append         (employee_id)
            __Name.append       (employee_name)
            __Shift.append      (employee_shift)
            __Line.append       (employee_line)
            __Operation1.append (employee_operation1)
            __Efficiency1.append(employee_efficiency1)
            __Operation2.append (employee_operation2)
            __Efficiency2.append(employee_efficiency2)
            __note1.append(note1)
            __note2.append(note2)
    __employee_list=pd.DataFrame(
            {
                'ID'         : __ID,
                'Name'       : __Name,
                'Line'       : __Line,
                'Shift'      : __Shift,
                'Operation1' : __Operation1,
                'Efficiency1': __Efficiency1,
                'Operation2' : __Operation2,
                'Efficiency2': __Efficiency2,
                'Note1'      : __note1,
                'Note2'      : __note2
            }        
        )
    __employee_list=__employee_list.sort_values(by=['Operation1'])
    __employee_list=__employee_list.reset_index(drop=True)
    print(__employee_list.to_json(orient='records'))

if __name__=="__main__":
    group=sys.argv[1]
    wc   =sys.argv[2]
    shift=sys.argv[3]
    week =sys.argv[4]
    get_employee_data()
