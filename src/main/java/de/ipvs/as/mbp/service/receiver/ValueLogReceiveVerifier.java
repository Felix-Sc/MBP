package de.ipvs.as.mbp.service.receiver;

import de.ipvs.as.mbp.domain.data_model.treelogic.DataModelTree;
import de.ipvs.as.mbp.domain.data_model.treelogic.DataModelTreeNode;
import org.bson.Document;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.math.BigDecimal;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * Provides methods to verify a given value log in a JSON representation
 * and to convert this JSON to a database-writeable {@link Document}
 * in compliance with a specified {@link DataModelTree}.
 */
public class ValueLogReceiveVerifier {

    /**
     * Validates if a JSON string matches a specified data model and returns
     * a {@link Document} matching the data model structure as well.<br>
     * All data types are interfered according to the respective {@link DataModelTree}
     * which means for example that a JSON integer number can be interpreted as
     * int (int32 with 32 bits) or as long (int64 with 64 bits) depending on the
     * data model {@link de.ipvs.as.mbp.domain.data_model.IoTDataTypes IoTDataTypes} details.
     *
     * @param valueRoot The root object of the JSON "value" object which is contained
     *                  by all mqtt messages originated from a sensor producing component.
     * @return A BSON document which can be inserted to the MongoDB.
     */
    public static Document validateJsonValueAndGetDocument(JSONObject valueRoot, DataModelTree dataModel) throws JSONException, ParseException {
        System.out.println(valueRoot.toString(1));
        Document doc = new Document();
        for (DataModelTreeNode node : dataModel.getRoot().getChildren()) {
            validateChild(node, null, valueRoot, doc, null, -1);
        }

        // TODO REMOVE DEBUGGING OUTPUT
        System.out.println("-------------------");
        for (Object o : doc.values()) {
            System.out.println(o.getClass() + " : " + o);
        }
        System.out.println("-------------------");

        for (Map.Entry<String, Object> e : doc.entrySet()) {
            System.out.println(e.getKey() + " : " + e.getValue());
        }
        System.out.println("-------------------");
        for (String key :  doc.keySet()) {
            System.out.println(key + " : " + doc.get(key));
        }
        System.out.println("-------------------");
        for (String key :  doc.keySet()) {
            System.out.println(key + " : " + doc.get(key));
        }
        System.out.println("-------------------");
        doc.forEach((key, value ) -> System.out.println(key + " : " + value));
        // TODO REMOVE DEBUGGING OUTPUT


        return doc;
    }

    /**
     * Recursive used method to handle one node of a {@link DataModelTree} in terms
     * of validating it and adding the contents appropriate to a {@link Document}
     * to return.
     *
     * @param currNode     The current node which should be investigated. Or in the view of a method
     *                     caller: The node to handle next.
     * @param lastArray    The JSONArray which was created last by the parent node. If the parent node
     *                     did not create an array, then set this to null (!).
     * @param lastObject   The JSONObject which was created last by the parent node. If the parent node
     *                     did not create an object, then set this to null (!).
     * @param lastDocument The document which was created last by one of the parent nodes.
     * @param lastList     The list which was created last by the parent node. Used to realize arrays for
     *                     the BSON document.
     * @param arrIndex     The array index (if the parent was an array) of this node. Or in the view of a method
     *                     caller: The array index of all next fields in an array (iterate through the whole
     *                     dimension).
     * @throws JSONException  If the JSON is invalid or not matching to the data model.
     * @throws ParseException If a Date was specified by the data model but the provided value data is
     *                        not parseable to a date.
     */
    private static void validateChild(DataModelTreeNode currNode, JSONArray lastArray, JSONObject lastObject, Document lastDocument, List<Object> lastList, int arrIndex) throws JSONException, ParseException {
        if (lastArray == null && lastObject != null) {
            switch (currNode.getType()) {

                case OBJECT:
                    JSONObject nextObject = lastObject.getJSONObject(currNode.getName());
                    if (nextObject.has(currNode.getName()))
                        throw new JSONException("Not a valid JSON as specified in the data model");

                    Document nextObjDoc = new Document();
                    lastDocument.append(currNode.getName(), nextObjDoc);

                    // Call the function for all childs recursively
                    for (DataModelTreeNode node : currNode.getChildren()) {
                        validateChild(node, null, nextObject, nextObjDoc, null, -1);
                    }
                    break;
                case ARRAY:
                    JSONArray nextArr = lastObject.getJSONArray(currNode.getName());

                    List<Object> nextList = new ArrayList<>();
                    lastDocument.append(currNode.getName(), nextList);

                    // Call the function for the childs recursively (dimensions are treated here as childs)
                    for (int i = 0; i < currNode.getSize(); i++) {
                        validateChild(currNode.getChildren().get(0), nextArr, null, null, nextList, i);
                    }
                    break;
                case DOUBLE:
                    System.out.println("Double --> object last: " + currNode.getName());
                    //System.out.println("last object: " + lastObject.toString(1));
                    double nextDouble = lastObject.getDouble(currNode.getName());
                    lastDocument.append(currNode.getName(), nextDouble);
                    break;
                case DECIMAL128:
                    // TODO Find a way to retrieve decimal128 values from JSON without using strings
                    // Big Decimal must be send as strings
                    BigDecimal nextBD = new BigDecimal(lastObject.getString(currNode.getName()));
                    lastDocument.append(currNode.getName(), nextBD);
                    break;
                case INT:
                    int nextInt = lastObject.getInt(currNode.getName());
                    lastDocument.append(currNode.getName(), nextInt);
                    break;
                case LONG:
                    long nextLong = lastObject.getLong(currNode.getName());
                    lastDocument.append(currNode.getName(), nextLong);
                    break;
                case BINARY:
                    String nextBinaryAsString = lastObject.getString(currNode.getName());
                    lastDocument.append(currNode.getName(), nextBinaryAsString.getBytes());
                    break;
                case STRING:
                    String nextString = lastObject.getString(currNode.getName());
                    lastDocument.append(currNode.getName(), nextString);
                    break;
                case BOOLEAN:
                    boolean nextBool = lastObject.getBoolean(currNode.getName());
                    lastDocument.append(currNode.getName(), nextBool);
                    break;
                case DATE:
                    String nextDateAsString = lastObject.getString(currNode.getName());
                    Date nextDate = new SimpleDateFormat("yyyy-mm-ddTHH:MM:ss").parse(nextDateAsString);
                    lastDocument.append(currNode.getName(), nextDate);
                    break;
            }
        } else if (lastArray != null && lastObject == null) {
            switch (currNode.getType()) {
                case OBJECT:
                    JSONObject nextObject = lastArray.getJSONObject(arrIndex);
                    if (nextObject.has(currNode.getName()))
                        throw new JSONException("Not a valid JSON as specified in the data model");

                    Document nextObjDoc = new Document();
                    lastList.add(nextObjDoc);

                    // Call the function for all childs recursively
                    for (int i = 0; i < currNode.getChildren().size(); i++) {
                        validateChild(currNode.getChildren().get(i), null, nextObject, nextObjDoc, null, i);
                    }
                    break;
                case ARRAY:
                    JSONArray nextArr = lastArray.getJSONArray(arrIndex);

                    List<Object> nextList = new ArrayList<>();
                    lastList.add(nextList);

                    // Call the function for the childs recursively (call it that often like dimensions)
                    for (int i = 0; i < currNode.getSize(); i++) {
                        validateChild(currNode.getChildren().get(0), nextArr, null, null, nextList, i);
                    }
                    break;
                case DOUBLE:
                    System.out.println("Double --> array last: " + currNode.getName());
                    double nextDouble = lastArray.getDouble(arrIndex);
                    lastList.add(nextDouble);
                    break;
                case DECIMAL128:
                    // TODO Find a way to retrieve decimal128 values from JSON without using strings
                    // Big Decimal must be send as strings
                    BigDecimal nextBD = new BigDecimal(lastArray.getString(arrIndex));
                    lastList.add(nextBD);
                    break;
                case INT:
                    int nextInt = lastArray.getInt(arrIndex);
                    lastList.add(nextInt);
                    break;
                case LONG:
                    long nextLong = lastArray.getLong(arrIndex);
                    lastList.add(nextLong);
                    break;
                case BINARY:
                    String nextBinaryAsString = lastArray.getString(arrIndex);
                    lastList.add(nextBinaryAsString.getBytes());
                    break;
                case STRING:
                    String nextString = lastArray.getString(arrIndex);
                    lastList.add(nextString);
                    break;
                case BOOLEAN:
                    boolean nextBool = lastArray.getBoolean(arrIndex);
                    lastList.add(nextBool);
                    break;
                case DATE:
                    String nextDateAsString = lastArray.getString(arrIndex);
                    Date nextDate = new SimpleDateFormat("yyyy-mm-ddTHH:MM:ss").parse(nextDateAsString);
                    lastList.add(nextDate);
                    break;
                default:
                    throw new JSONException("Not a valid mqtt message value");
            }
        }
    }
}
