import pyodbc
import pandas as pd
from sqlalchemy import create_engine
import mysql.connector
import mysql

# connection = pyodbc.connect('Driver={Oracle in OraClient12home1};DBQ=prod1;Uid=bukhang;Pwd=Khang25')
engine = create_engine('mysql+mysqlconnector://i_admin:Hy$2020@10.144.12.93:3306/pr2k', echo=False)

def drop_data():
    mydb=mysql.connector.connect(host='10.144.12.93',user='i_admin',passwd='Hy$2020',database="pr2k")
    myCursor=mydb.cursor()
    sql="DELETE FROM sah;"
    myCursor.execute(sql)
    mydb.commit()
    myCursor.close()
    mydb.close()

#test the connection
# cursor = connection.cursor()

#Example command to print the unique values of the field 'pacfin_group_gear_code' 
def update_data():
    data=pd.read_csv('sah_update.csv')
    # SQLCommand = ('SELECT MFG_PATH.MFG_PATH_ID as "Plant", STYLE.STYLE_CD as "Style_CD", OPER_ROUTING.ACTIVITY_CD as "Activity", AVG(OPER_ROUTING.STD_LABOR_TIME) as "SAH", STYLE.PACK_CD as "Pack_Unit", PACK.PACKAGE_QTY as "Pack_Qty", ITEM_SIZE.SIZE_SHORT_DESC as "Size", OPER_ROUTING.OPERATION_NO as "Operation_code" '
    #             + 'FROM DA.MFG_PATH MFG_PATH '
    #             + 'Left join DA.OPER_ROUTING OPER_ROUTING ON MFG_PATH.ROUTING_ID = OPER_ROUTING.ROUTING_ID '
    #             + 'LEFT JOIN DA.STYLE STYLE ON MFG_PATH.STYLE_CD = STYLE.STYLE_CD '
    #             + 'LEFT JOIN DA.PACK PACK ON STYLE.PACK_CD = PACK.PACK_CD '
    #             + 'LEFT JOIN DA.ITEM_SIZE ITEM_SIZE ON MFG_PATH.SIZE_CD = ITEM_SIZE.SIZE_CD '
    #             + "WHERE (OPER_ROUTING.OPERATION_NO='60900' OR OPER_ROUTING.OPERATION_NO='60500') AND (MFG_PATH.MFG_PATH_ID='96' OR MFG_PATH.MFG_PATH_ID='95') "
    #             + 'group by MFG_PATH.MFG_PATH_ID,STYLE.STYLE_CD,ITEM_SIZE.SIZE_SHORT_DESC,OPER_ROUTING.ACTIVITY_CD,STYLE.PACK_CD,PACK.PACKAGE_QTY, ITEM_SIZE.SIZE_SHORT_DESC , OPER_ROUTING.OPERATION_NO')
    # print(SQLCommand)
    # data=pd.read_sql(SQLCommand,con=connection)
    # data.to_csv("sah_update.csv",index=False) #,columns=['Plant', 'Style_CD', 'Activity', 'SAH', 'Pack_Unit', 'Color', 'Size', 'Operation_code'])
    data.to_sql('sah',engine,if_exists='append',index=False,index_label=None)

    print(data)
    # with pd.ExcelWriter("SAH_Update.xlsx",mode='w') as writer:
    #     data.to_excel(writer, index=False)
    print(len(data))
# drop_data()
update_data()