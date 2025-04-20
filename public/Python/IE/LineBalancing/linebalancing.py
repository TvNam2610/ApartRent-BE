import sys, json
import mysql.connector, mysql
import pandas as pd
from sqlalchemy import create_engine
import numpy as np

hostname='pbvweb01v'
engine = create_engine('mysql+mysqlconnector://root:123456@pbvweb01v:3306/linebalancing', echo=False)
engineNam = create_engine('mysql+mysqlconnector://root:123456@pbvweb01v:3306/erpsystem', echo=False)

def get_garment_from_style(style):
    garments=pd.read_sql('Select Garment from setup_style_by_garment where Style="'+style+'";', engine)
    engine.dispose()
    if len(garments)>0:
        return garments.iloc[len(garments)-1][0]
    else:
        return ''
    
def is_sewing_operation(operation):
    check=pd.read_sql('select Operation from setup_operation_non_sewing where Operation="'+operation+'"', engine)
    engine.dispose()
    if len(check)>0 or operation=='':
        return False
    else:
        return True
    
def get_operation(employee_list, style, size):
    style=style
    garment=get_garment_from_style(style)
    size=size
    op_op          = []
    op_sam         = []
    op_absenteeism = []
    op_mat         = []
    op_quanlity    = []
    op_avg_eff     = []
    op_reduceQ     = []
    op_reduceE     = []
    op_reduceE_z   = []
    op_addQ        = []
    op_addE        = []
    op_addE_z      = []
    op_output      = []
    op_machine     = []
    op_sq          = []
    op_comment     = []
    op_op1         = []
    operation_query=pd.read_sql('select distinct Operation FROM setup_operation_sam WHERE Garment="'+garment+'" AND Size="'+size+'"', engine)
    engine.dispose()
    operation_len=len(operation_query)
    for row in range(0,operation_len):
        if is_sewing_operation(operation_query['Operation'][row])==True:
            operation=operation_query['Operation'][row]                                                     #Operation
            sq=pd.read_sql('select distinct SQ, SAH FROM setup_operation_sam WHERE Garment="'+garment+'" AND Size="'+size+'" and Operation="'+operation+'"', engine)
            operation_sq=sq['SQ'][0]
            operation_sam=sq['SAH'][0]
            employee_query=employee_list.query('Operation1=="'+operation+'"')
            employee_query=employee_query.reset_index(drop=True)
            mainQ=len(employee_query)
            operation_quanlity=mainQ                                                                #Main Q
            operation_mat_query=employee_query.query('Shift=="MAT"')
            operation_mat=len(operation_mat_query)                                                   #MAT
            if len(employee_query)>0:
                mainE=round(sum(list(map(float, employee_query['Efficiency1'])))/len(employee_query),1)#Main Eff
            else:
                mainE=0
            operation_avg_eff=mainE
            if operation_sam==0:
                operation_output=0
            else:
                operation_output=round((mainQ*7.5-operation_mat)*mainE/(operation_sam*100))          #Output
            op_absenteeism.append('0')
            op_op.append(operation)
            op_sam.append(operation_sam)
            op_mat.append(operation_mat)
            op_avg_eff.append(operation_avg_eff)
            op_sq.append(operation_sq)
            op_quanlity.append(operation_quanlity)
            op_output.append(operation_output)
            op_reduceQ.append(0)
            op_reduceE.append(operation_avg_eff)
            op_reduceE_z.append(0)
            op_addQ.append(0)
            op_addE.append(operation_avg_eff)
            op_addE_z.append(0)
            op_machine.append(operation_quanlity)
            op_comment.append(' ')
            op_op1.append('')
    engine.dispose()
    operation_data=pd.DataFrame(
            {
                    "Absenteeism": op_absenteeism,#0
                    "Operation"  : op_op,         #1
                    "SAM"        : op_sam,        #2
                    "MAT"        : op_mat,        #3
                    "MainQ"      : op_quanlity,   #4
                    "MainE"      : op_avg_eff,    #5
                    "ReduceQ"    : op_reduceQ,    #6
                    "ReduceE"    : op_reduceE,    #7
                    "AddQ"       : op_addQ,       #8
                    "AddE"       : op_addE,       #9
                    "Output"     : op_output,     #10
                    "Machine"    : op_machine,    #11
                    "SQ"         : op_sq,         #12
                    "ReduceE2"   : op_reduceE_z,  #13
                    "AddE2"      : op_addE_z,     #14
                    "Comment"    : op_comment,    #15
                    'Operation1' : op_op1         #16
            }
    )
    operation_data=operation_data.sort_values(by=['SQ'])
    operation_data=operation_data.reset_index(drop=True)
    return operation_data

def ie_chose_employee_operation2_event(ID, employee_list, operation_principle):
    emp=employee_list.query('ID=="'+str(ID)+'"')
    name2 = emp.iloc[0,1]
    op1   = emp.iloc[0,4]
    ef1   = emp.iloc[0,5]
    ef2   = emp.iloc[0,7]
    row=0
    len_data=len(operation_principle)
    while row<len_data and op1!=operation_principle.iloc[row, 1]:
        row=row+1
    operation_principle.iloc[row, 13]=ef1#ReduceE2
    addE=ef2
    return addE, name2, op1

def get_operation2_auto(emp_op2, operation_principle, employee_list):
    #get operation 1 max output of list that have operation 2  
    op1=emp_op2['Operation1'].unique()
    opMax=0
    nameOpMax=''
    for op in op1:
        if is_sewing_operation(op):
            row=0
            while row<len(operation_principle) and op!=operation_principle.iloc[row,1]:
                row=row+1
            if opMax<operation_principle.iloc[row,10]:
                opMax=operation_principle.iloc[row,10]
                nameOpMax=operation_principle.iloc[row,1]
    emps_chosen=emp_op2.query('Operation1=="'+nameOpMax+'"').copy()
    if len(emps_chosen)==1:
        addE, name2, op1=ie_chose_employee_operation2_event(emps_chosen.iloc[0,0], employee_list, operation_principle)
    elif len(emps_chosen)>1:
        emps_chosen=emps_chosen.reset_index(drop=True)
        minEffEmp = emps_chosen['Efficiency1'].idxmin()#update min output
        addE, name2, op1=ie_chose_employee_operation2_event(emps_chosen.iloc[minEffEmp, 0], employee_list, operation_principle)
    return addE, name2, op1

def get_added_operation_row(rowMinOutput, operation_principle):
    op1=operation_principle['Operation1'][rowMinOutput]
    row=0
    len_data=len(operation_principle)
    while row<len_data and op1!=operation_principle.iloc[row, 1]:
        row=row+1
    return row

def get_operation2_line_balancing_auto(operation_data, employee_list):
    maxstep=1000
    step=0
    maxRate=98
    rate=0
    operation_principle=operation_data.copy()
    while step<maxstep and rate<maxRate:
        step=step+1
        maxOutput    = operation_principle['Output'].max()#update max output
        rowMinOutput = operation_principle['Output'].idxmin()#update min output
        minOutput    = operation_principle['Output'].min()
        rate         = float(minOutput)/float(maxOutput)*100.0#update current balancing rate
        minOperation = operation_principle.iloc[rowMinOutput, 1]#update employee has operation 2 is min operation
        addE         = operation_principle.iloc[rowMinOutput, 14]
        reduceEofMin = operation_principle.iloc[rowMinOutput, 13]
        if float(addE)==0 and float(reduceEofMin)==0:
            emp_op2  = employee_list.query('Operation2=="'+minOperation+'"')
            if len(emp_op2)>0:
                addE, name2, op1=get_operation2_auto(emp_op2, operation_principle, employee_list)
                operation_principle.iloc[rowMinOutput, 14] = addE#AddE2
                operation_principle.iloc[rowMinOutput, 15] = name2 + ' (Chuyển từ '+op1+')'
                operation_principle.iloc[rowMinOutput, 16] = op1
        rowReduceQ  = get_added_operation_row(rowMinOutput, operation_principle)
        if rowReduceQ<len(operation_principle):
            addQ    = float(operation_principle['AddQ'][rowMinOutput])
            addQ    = addQ+0.05
            operation_principle.iloc[rowMinOutput,8]=addQ
            reduceQ = float(operation_principle['ReduceQ'][rowReduceQ])
            reduceQ = reduceQ+0.05
            operation_principle.iloc[rowReduceQ,6]=reduceQ
            reduceE = operation_principle.iloc[rowReduceQ, 13]
            addE    = operation_principle.iloc[rowMinOutput, 14]
            mat     = float(operation_principle['MAT'][rowReduceQ])
            mainQ   = float(operation_principle['MainQ'][rowReduceQ])
            mainE   = float(operation_principle['MainE'][rowReduceQ])
            sam     = float(operation_principle['SAM'][rowReduceQ])
            reduceQ = float(operation_principle['ReduceQ'][rowReduceQ])
            addQ    = float(operation_principle['AddQ'][rowReduceQ])
            operation_principle.iloc[rowReduceQ,10]=round(((7.5*mainQ-mat)*mainE-reduceQ*reduceE)/(sam*100))
            mat     = float(operation_principle['MAT'][rowMinOutput])
            mainQ   = float(operation_principle['MainQ'][rowMinOutput])
            mainE   = float(operation_principle['MainE'][rowMinOutput])
            sam     = float(operation_principle['SAM'][rowMinOutput])
            reduceQ = float(operation_principle['ReduceQ'][rowMinOutput])
            addQ    = float(operation_principle['AddQ'][rowMinOutput])
            operation_principle.iloc[rowMinOutput,10]=round(((7.5*mainQ-mat)*mainE+addQ*addE)/(sam*100))
    return operation_principle

if __name__=="__main__":
    style    = sys.argv[1]
    size     = sys.argv[2]
    emp_list = sys.argv[3]
    emp_data=pd.read_json(emp_list, orient='records')
    emp_data=emp_data[['ID','Name','Line','Shift','Operation1','Efficiency1','Operation2','Efficiency2','Note1','Note2']]
    op_data=get_operation(emp_data, style, size)
    auto_data=get_operation2_line_balancing_auto(op_data, emp_data)
    print(auto_data.to_json(orient='records'))